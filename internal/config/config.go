package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	MongoDB  MongoDBConfig
	RabbitMQ RabbitMQConfig
	Queue    QueueConfig
	Logging  LoggingConfig
}

type ServerConfig struct {
	Port string
}

type DatabaseConfig struct {
	URL             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

type MongoDBConfig struct {
	URL      string
	Database string
}

type RabbitMQConfig struct {
	URL string
}

type QueueConfig struct {
	TransactionQueue string
	RetryQueue       string
	MaxRetryAttempts int
}

type LoggingConfig struct {
	Level string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
		},
		Database: DatabaseConfig{
			URL:             getEnv("POSTGRES_URL", "postgres://banking_user:banking_password@localhost:5432/banking_db?sslmode=disable"),
			MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: getEnvAsDuration("DB_CONN_MAX_LIFETIME", "5m"),
		},
		MongoDB: MongoDBConfig{
			URL:      getEnv("MONGODB_URL", "mongodb://mongo_user:mongo_password@localhost:27017/banking_logs?authSource=admin"),
			Database: getEnv("MONGODB_DATABASE", "banking_logs"),
		},
		RabbitMQ: RabbitMQConfig{
			URL: getEnv("RABBITMQ_URL", "amqp://rabbit_user:rabbit_password@localhost:5672/"),
		},
		Queue: QueueConfig{
			TransactionQueue: getEnv("TRANSACTION_QUEUE", "transactions"),
			RetryQueue:       getEnv("RETRY_QUEUE", "transaction_retries"),
			MaxRetryAttempts: getEnvAsInt("MAX_RETRY_ATTEMPTS", 3),
		},
		Logging: LoggingConfig{
			Level: getEnv("LOG_LEVEL", "info"),
		},
	}

	return cfg, nil
}

// Helper functions
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
		logrus.Warnf("Invalid integer value for %s: %s, using fallback: %d", key, value, fallback)
	}
	return fallback
}

func getEnvAsDuration(key string, fallback string) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
		logrus.Warnf("Invalid duration value for %s: %s, using fallback: %s", key, value, fallback)
	}
	fallbackDuration, _ := time.ParseDuration(fallback)
	return fallbackDuration
}
