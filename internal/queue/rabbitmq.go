package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"banking-system/internal/config"
	"banking-system/internal/models"

	"github.com/rabbitmq/amqp091-go"
	"github.com/sirupsen/logrus"
)

// RabbitMQ wraps the RabbitMQ connection and channel
type RabbitMQ struct {
	conn    *amqp091.Connection
	channel *amqp091.Channel
	config  *config.QueueConfig
}

// NewRabbitMQ creates a new RabbitMQ connection
func NewRabbitMQ(cfg *config.RabbitMQConfig, queueCfg *config.QueueConfig) (*RabbitMQ, error) {
	conn, err := amqp091.Dial(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	rabbit := &RabbitMQ{
		conn:    conn,
		channel: channel,
		config:  queueCfg,
	}

	// Declare queues
	if err := rabbit.declareQueues(); err != nil {
		rabbit.Close()
		return nil, fmt.Errorf("failed to declare queues: %w", err)
	}

	logrus.Info("RabbitMQ connected successfully")
	return rabbit, nil
}

// declareQueues declares all necessary queues
func (r *RabbitMQ) declareQueues() error {
	queues := []string{
		r.config.TransactionQueue,
		r.config.RetryQueue,
	}

	for _, queueName := range queues {
		_, err := r.channel.QueueDeclare(
			queueName, // name
			true,      // durable
			false,     // delete when unused
			false,     // exclusive
			false,     // no-wait
			nil,       // arguments
		)
		if err != nil {
			return fmt.Errorf("failed to declare queue %s: %w", queueName, err)
		}
	}

	return nil
}

// PublishTransaction publishes a transaction message to the queue
func (r *RabbitMQ) PublishTransaction(ctx context.Context, msg *models.TransactionMessage) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal transaction message: %w", err)
	}

	queueName := r.config.TransactionQueue
	if msg.RetryCount > 0 {
		queueName = r.config.RetryQueue
	}

	return r.channel.PublishWithContext(
		ctx,
		"",        // exchange
		queueName, // routing key
		false,     // mandatory
		false,     // immediate
		amqp091.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp091.Persistent, // Make message persistent
			Timestamp:    time.Now(),
		},
	)
}

// ConsumeTransactions consumes transaction messages from the queue
func (r *RabbitMQ) ConsumeTransactions(ctx context.Context, handler func(context.Context, *models.TransactionMessage) error) error {
	msgs, err := r.channel.Consume(
		r.config.TransactionQueue, // queue
		"",                        // consumer
		false,                     // auto-ack
		false,                     // exclusive
		false,                     // no-local
		false,                     // no-wait
		nil,                       // args
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	logrus.Info("Started consuming transaction messages")

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case msg, ok := <-msgs:
			if !ok {
				return fmt.Errorf("channel closed")
			}

			var txMsg models.TransactionMessage
			if err := json.Unmarshal(msg.Body, &txMsg); err != nil {
				logrus.WithError(err).Error("Failed to unmarshal transaction message")
				msg.Nack(false, false) // Don't requeue malformed messages
				continue
			}

			if err := handler(ctx, &txMsg); err != nil {
				logrus.WithError(err).WithField("transaction_id", txMsg.TransactionID).Error("Failed to process transaction")
				
				// Retry logic
				if txMsg.RetryCount < r.config.MaxRetryAttempts {
					txMsg.RetryCount++
					if retryErr := r.PublishTransaction(ctx, &txMsg); retryErr != nil {
						logrus.WithError(retryErr).Error("Failed to publish retry message")
					}
				}
				
				msg.Nack(false, false)
				continue
			}

			msg.Ack(false)
		}
	}
}

// Close closes the RabbitMQ connection
func (r *RabbitMQ) Close() error {
	if r.channel != nil {
		r.channel.Close()
	}
	if r.conn != nil {
		return r.conn.Close()
	}
	return nil
}