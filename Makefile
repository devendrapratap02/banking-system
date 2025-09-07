.PHONY: build test clean docker-build docker-up docker-down deps

# Variables
BINARY_NAME_API=api-gateway
BINARY_NAME_PROCESSOR=transaction-processor
DOCKER_COMPOSE_FILE=docker-compose.yml

# Build commands
build:
	@echo "Building API Gateway..."
	go build -o bin/$(BINARY_NAME_API) ./cmd/api-gateway
	@echo "Building Transaction Processor..."
	go build -o bin/$(BINARY_NAME_PROCESSOR) ./cmd/transaction-processor

# Clean build artifacts
clean:
	@echo "Cleaning..."
	rm -rf bin/
	go clean

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

# Run tests
test:
	@echo "Running tests..."
	go test -v -race -coverprofile=coverage.out ./...

# Run tests with coverage report
test-coverage:
	@echo "Running tests with coverage..."
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Docker commands
docker-build:
	@echo "Building Docker images..."
	docker compose build

docker-up:
	@echo "Starting services..."
	docker compose up -d

docker-down:
	@echo "Stopping services..."
	docker compose down

docker-logs:
	@echo "Showing logs..."
	docker compose logs -f

# Development commands
dev-setup:
	@echo "Setting up development environment..."
	cp .env.example .env
	make deps

run-api:
	@echo "Running API Gateway locally..."
	go run ./cmd/api-gateway

run-processor:
	@echo "Running Transaction Processor locally..."
	go run ./cmd/transaction-processor

# Database commands
migrate-up:
	@echo "Running database migrations..."
	# Add migration commands here if using a migration tool

migrate-down:
	@echo "Rolling back database migrations..."
	# Add rollback commands here if using a migration tool

# Linting
lint:
	@echo "Running linters..."
	golangci-lint run

# Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Security scan
security:
	@echo "Running security scan..."
	gosec ./...

# Full CI pipeline
ci: deps fmt lint test

# Production deployment
deploy-prod: test docker-build
	@echo "Deploying to production..."
	# Add production deployment commands here