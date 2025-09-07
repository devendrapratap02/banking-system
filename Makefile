.PHONY: build test clean docker-build docker-up docker-down deps run-full run-backend run-frontend

# Variables
BINARY_NAME_API=api-gateway
BINARY_NAME_PROCESSOR=transaction-processor
DOCKER_COMPOSE_FULL=docker-compose.full.yml
DOCKER_COMPOSE_BACKEND=docker-compose.backend.yml
DOCKER_COMPOSE_FRONTEND=docker-compose.frontend.yml
DOCKER_COMPOSE_DEV=docker-compose.yml

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
	docker system prune -f

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

# ==============================================================================
# DOCKER COMMANDS - FULL STACK
# ==============================================================================

# Build all Docker images
docker-build:
	@echo "🔨 Building all Docker images..."
	docker compose -f $(DOCKER_COMPOSE_FULL) build

# Run complete system (Backend + Frontend + Databases)
run-full:
	@echo "🚀 Starting complete banking system (Backend + Frontend + Databases)..."
	@echo "📊 Dashboard will be available at: http://localhost:3000"
	@echo "🔌 API will be available at: http://localhost:8080"
	@echo "🐰 RabbitMQ Management: http://localhost:15672 (rabbit_user/rabbit_password)"
	docker compose -f $(DOCKER_COMPOSE_FULL) up -d
	@echo "✅ All services started! Check status with: make status"

# Stop complete system
stop-full:
	@echo "🛑 Stopping complete banking system..."
	docker compose -f $(DOCKER_COMPOSE_FULL) down

# ==============================================================================
# DOCKER COMMANDS - BACKEND ONLY
# ==============================================================================

# Run backend only (API + Databases + Transaction Processor)
run-backend:
	@echo "🔧 Starting backend services only..."
	@echo "🔌 API will be available at: http://localhost:8080"
	@echo "🐰 RabbitMQ Management: http://localhost:15672 (rabbit_user/rabbit_password)"
	docker compose -f $(DOCKER_COMPOSE_BACKEND) up -d
	@echo "✅ Backend services started!"

# Stop backend
stop-backend:
	@echo "🛑 Stopping backend services..."
	docker compose -f $(DOCKER_COMPOSE_BACKEND) down

# ==============================================================================
# DOCKER COMMANDS - FRONTEND ONLY
# ==============================================================================

# Run frontend only (requires backend to be running)
run-frontend:
	@echo "🎨 Starting frontend service only..."
	@echo "⚠️  Make sure backend is running first!"
	@echo "📊 Dashboard will be available at: http://localhost:3000"
	docker compose -f $(DOCKER_COMPOSE_FRONTEND) up -d
	@echo "✅ Frontend service started!"

# Stop frontend
stop-frontend:
	@echo "🛑 Stopping frontend service..."
	docker compose -f $(DOCKER_COMPOSE_FRONTEND) down

# ==============================================================================
# DOCKER COMMANDS - DEVELOPMENT
# ==============================================================================

# Original dev setup (backend only, no frontend container)
docker-up:
	@echo "🔧 Starting development environment (backend containers only)..."
	docker compose -f $(DOCKER_COMPOSE_DEV) up -d

# Stop dev environment
docker-down:
	@echo "🛑 Stopping development environment..."
	docker compose -f $(DOCKER_COMPOSE_DEV) down

# ==============================================================================
# MONITORING & MANAGEMENT
# ==============================================================================

# Show status of all services
status:
	@echo "📊 Full Stack Status:"
	@docker compose -f $(DOCKER_COMPOSE_FULL) ps
	@echo "\n🔧 Backend Only Status:"
	@docker compose -f $(DOCKER_COMPOSE_BACKEND) ps
	@echo "\n🎨 Frontend Only Status:"
	@docker compose -f $(DOCKER_COMPOSE_FRONTEND) ps

# Show logs for full stack
logs-full:
	@echo "📋 Showing logs for complete system..."
	docker compose -f $(DOCKER_COMPOSE_FULL) logs -f

# Show logs for backend only
logs-backend:
	@echo "📋 Showing logs for backend services..."
	docker compose -f $(DOCKER_COMPOSE_BACKEND) logs -f

# Show logs for frontend only
logs-frontend:
	@echo "📋 Showing logs for frontend service..."
	docker compose -f $(DOCKER_COMPOSE_FRONTEND) logs -f

# Show logs for specific service
logs:
	@echo "📋 Usage: make logs SERVICE=api-gateway|transaction-processor|frontend|postgres|mongodb|rabbitmq"
	@if [ -n "$(SERVICE)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_FULL) logs -f $(SERVICE); \
	fi

# Restart specific service
restart:
	@echo "🔄 Usage: make restart SERVICE=api-gateway|transaction-processor|frontend|postgres|mongodb|rabbitmq"
	@if [ -n "$(SERVICE)" ]; then \
		docker compose -f $(DOCKER_COMPOSE_FULL) restart $(SERVICE); \
	fi

# Clean up everything
clean-docker:
	@echo "🧹 Cleaning up Docker resources..."
	docker compose -f $(DOCKER_COMPOSE_FULL) down -v
	docker compose -f $(DOCKER_COMPOSE_BACKEND) down -v
	docker compose -f $(DOCKER_COMPOSE_FRONTEND) down -v
	docker compose -f $(DOCKER_COMPOSE_DEV) down -v
	docker system prune -f
	docker volume prune -f

# ==============================================================================
# LOCAL DEVELOPMENT COMMANDS
# ==============================================================================

# Development setup
dev-setup:
	@echo "🛠️  Setting up development environment..."
	@if [ ! -f .env ]; then cp .env.example .env 2>/dev/null || true; fi
	make deps
	@echo "✅ Development environment ready!"

# Run API Gateway locally (requires databases)
run-api:
	@echo "🔌 Running API Gateway locally..."
	@echo "⚠️  Make sure databases are running: make run-backend"
	go run ./cmd/api-gateway

# Run Transaction Processor locally (requires databases)
run-processor:
	@echo "⚙️  Running Transaction Processor locally..."
	@echo "⚠️  Make sure databases are running: make run-backend"
	go run ./cmd/transaction-processor

# Run frontend locally (requires Node.js)
run-frontend-dev:
	@echo "🎨 Running frontend in development mode..."
	@echo "⚠️  Make sure backend is running: make run-backend"
	cd frontend && npm start

# Install frontend dependencies
frontend-deps:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

# ==============================================================================
# TESTING & QUALITY
# ==============================================================================

# Database commands
migrate-up:
	@echo "🔼 Running database migrations..."
	# Add migration commands here if using a migration tool

migrate-down:
	@echo "🔽 Rolling back database migrations..."
	# Add rollback commands here if using a migration tool

# Health check all services
health-check:
	@echo "🩺 Checking health of all services..."
	@echo "API Gateway:" && curl -s http://localhost:8080/health || echo "❌ API Gateway not responding"
	@echo "Frontend:" && curl -s http://localhost:3000/health || echo "❌ Frontend not responding"
	@echo "RabbitMQ Management:" && curl -s http://localhost:15672 || echo "❌ RabbitMQ Management not responding"

# Linting
lint:
	@echo "🔍 Running linters..."
	golangci-lint run

# Format code
fmt:
	@echo "✨ Formatting code..."
	go fmt ./...

# Security scan
security:
	@echo "🔒 Running security scan..."
	gosec ./...

# Full CI pipeline
ci: deps fmt lint test

# ==============================================================================
# HELP
# ==============================================================================

help:
	@echo "🏦 Banking System - Available Commands"
	@echo ""
	@echo "🚀 QUICK START:"
	@echo "  make run-full          Start complete system (Backend + Frontend + Databases)"
	@echo "  make run-backend       Start backend only (API + Databases)"
	@echo "  make run-frontend      Start frontend only (requires backend running)"
	@echo ""
	@echo "🛑 STOP SERVICES:"
	@echo "  make stop-full         Stop complete system"
	@echo "  make stop-backend      Stop backend services"
	@echo "  make stop-frontend     Stop frontend service"
	@echo ""
	@echo "📊 MONITORING:"
	@echo "  make status           Show status of all services"
	@echo "  make logs-full        Show logs for complete system"
	@echo "  make logs-backend     Show logs for backend"
	@echo "  make logs-frontend    Show logs for frontend"
	@echo "  make health-check     Check health of all services"
	@echo ""
	@echo "🔨 DEVELOPMENT:"
	@echo "  make dev-setup        Setup development environment"
	@echo "  make run-api          Run API Gateway locally"
	@echo "  make run-processor    Run Transaction Processor locally"
	@echo "  make run-frontend-dev Run frontend in dev mode"
	@echo ""
	@echo "🧹 CLEANUP:"
	@echo "  make clean-docker     Clean up all Docker resources"
	@echo "  make clean            Clean build artifacts"
	@echo ""
	@echo "🔗 SERVICE URLS:"
	@echo "  Frontend:              http://localhost:3000"
	@echo "  API Gateway:           http://localhost:8080"
	@echo "  RabbitMQ Management:   http://localhost:15672"
	@echo "  PostgreSQL:            localhost:5432"
	@echo "  MongoDB:               localhost:27017"

# Production deployment
deploy-prod: test docker-build
	@echo "🚀 Deploying to production..."
	# Add production deployment commands here