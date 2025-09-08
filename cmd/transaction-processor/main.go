package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"banking-system/internal/config"
	"banking-system/internal/database"
	"banking-system/internal/queue"
	"banking-system/internal/repository"
	"banking-system/internal/service"

	"github.com/sirupsen/logrus"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Setup logging
	setupLogging(cfg.Logging.Level)

	// Initialize PostgreSQL database
	postgresDB, err := database.NewPostgresDB(&cfg.Database)
	if err != nil {
		logrus.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer postgresDB.Close()

	// Initialize MongoDB
	mongoDB, err := database.NewMongoDB(&cfg.MongoDB)
	if err != nil {
		logrus.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongoDB.Close(context.Background())

	// Initialize RabbitMQ
	rabbitMQ, err := queue.NewRabbitMQ(&cfg.RabbitMQ, &cfg.Queue)
	if err != nil {
		logrus.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer rabbitMQ.Close()

	// Initialize repositories
	accountRepo := repository.NewAccountRepository(postgresDB)
	transactionRepo := repository.NewTransactionRepository(mongoDB)

	// Initialize services
	transactionService := service.NewTransactionService(transactionRepo, accountRepo, rabbitMQ)

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start consuming transactions
	go func() {
		logrus.Info("Starting transaction processor")
		if err := rabbitMQ.ConsumeTransactions(ctx, transactionService.ProcessTransaction); err != nil {
			logrus.WithError(err).Error("Failed to consume transactions")
			cancel()
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("Shutting down transaction processor...")
	cancel()

	logrus.Info("Transaction processor exited")
}

func setupLogging(level string) {
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetOutput(os.Stdout)

	switch level {
	case "debug":
		logrus.SetLevel(logrus.DebugLevel)
	case "info":
		logrus.SetLevel(logrus.InfoLevel)
	case "warn":
		logrus.SetLevel(logrus.WarnLevel)
	case "error":
		logrus.SetLevel(logrus.ErrorLevel)
	default:
		logrus.SetLevel(logrus.InfoLevel)
	}
}
