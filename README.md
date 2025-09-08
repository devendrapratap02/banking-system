# 🏦 Banking Ledger System

A comprehensive banking ledger service implementing a microservices architecture with ACID-like consistency for financial transactions. Built with Go, React, and Docker.

![Banking System](https://img.shields.io/badge/Go-1.22+-blue) ![React](https://img.shields.io/badge/React-18.2+-61DAFB) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED) ![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This banking ledger system is designed to handle high-volume financial transactions with reliability and consistency. It implements a distributed microservices pattern with clear separation of concerns and ACID-compliant data storage.

### Key Capabilities

- ✅ **Account Management**: Create and manage bank accounts with multi-currency support
- ✅ **Transaction Processing**: Handle deposits, withdrawals, and transfers asynchronously
- ✅ **ACID Compliance**: Ensure data consistency and prevent double-spending
- ✅ **Audit Trail**: Comprehensive transaction logging and history
- ✅ **High Scalability**: Horizontal scaling with message queues
- ✅ **Real-time UI**: Modern React frontend with auto-updating dashboards

## 🏗️ Architecture

### Microservices Components

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   Frontend      │    │   API Gateway    │    │ Transaction        │
│   (React)       │───▶│   (Port 8080)    │    │ Processor          │
│   (Port 3000)   │    │                  │    │ (Background)       │
└─────────────────┘    └──────────────────┘    └────────────────────┘
                                │                         │
                                ▼                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   PostgreSQL    │    │    RabbitMQ      │    │     MongoDB        │
│   (Balances)    │    │   (Messages)     │    │   (Audit Logs)     │
│   (Port 5432)   │    │   (Port 5672)    │    │   (Port 27017)     │
└─────────────────┘    └──────────────────┘    └────────────────────┘
```

### Data Strategy

- **PostgreSQL**: ACID-compliant storage for account balances (critical for consistency)
- **MongoDB**: Scalable document storage for transaction logs and audit trails
- **RabbitMQ**: Message queue ensuring reliable transaction processing with retry logic

## ✨ Features

### Backend Features

- **Multi-Currency Support**: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR
- **Async Processing**: Non-blocking transaction handling with automatic retries
- **ACID Compliance**: Database-level consistency checks prevent race conditions
- **Comprehensive Logging**: Structured JSON logging with correlation IDs
- **Health Checks**: Built-in health monitoring for all services
- **Error Handling**: Graceful error handling with appropriate HTTP status codes

### Frontend Features

- **Real-time Dashboard**: Live account balances and transaction statistics
- **Currency Toggle**: Auto-rotating multi-currency balance display
- **Responsive Design**: Mobile-friendly interface with modern UI components
- **Error Boundaries**: Robust error handling preventing app crashes
- **Browser Extension Protection**: Filters out external script errors

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- Make (optional, for convenience commands)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd banking-system
```

### 2. Start the Complete System

```bash
# Start all services (backend + frontend)
make docker-up

# Or manually with docker compose
docker compose -f docker-compose.full.yml up -d
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

### 4. Create Your First Account

Navigate to http://localhost:3000/create-account or use the API:

```bash
curl -X POST http://localhost:8080/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "currency": "USD",
    "initial_balance": 1000.00
  }'
```

## 📚 API Documentation

### Core Endpoints

#### Accounts

```bash
# Create Account
POST /api/v1/accounts
{
  "name": "John Doe",
  "currency": "USD",
  "initial_balance": 1000.00
}

# Get All Accounts
GET /api/v1/accounts

# Get Account by ID
GET /api/v1/accounts/{id}
```

#### Transactions

```bash
# Create Transaction
POST /api/v1/transactions
{
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "deposit",
  "amount": 500.00,
  "description": "Salary deposit"
}

# Get Transaction History
GET /api/v1/transactions?account_id={id}&limit=10
```

#### Dashboard

```bash
# Get Dashboard Data (Optimized)
GET /api/v1/dashboard
```

For complete API documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md).

## 🛠️ Development

### Available Make Commands

```bash
# Backend Development
make run-api              # Start API Gateway locally
make run-processor        # Start Transaction Processor locally
make build                # Build all binaries

# Docker Operations
make docker-up            # Start all services
make docker-down          # Stop all services
make docker-logs          # View all logs
make docker-rebuild       # Rebuild and restart

# Testing
make test                 # Run all tests
make test-coverage        # Generate coverage report
make lint                 # Run linter

# Database Operations
make db-reset             # Reset databases with fresh data
make db-migrate           # Run database migrations

# Monitoring
make monitor              # View service status
make logs-api             # View API Gateway logs
make logs-processor       # View Transaction Processor logs
```

### Local Development Setup

1. **Start Dependencies**:
   ```bash
   make backend-deps  # Start PostgreSQL, MongoDB, RabbitMQ
   ```

2. **Run Services Locally**:
   ```bash
   make run-api       # Terminal 1
   make run-processor # Terminal 2
   ```

3. **Frontend Development**:
   ```bash
   make run-frontend  # Start React dev server
   ```

### Project Structure

```
banking-system/
├── cmd/                          # Application entry points
│   ├── api-gateway/             # HTTP API server
│   └── transaction-processor/   # Background worker
├── internal/                    # Internal packages
│   ├── config/                  # Configuration management
│   ├── database/               # Database connections
│   ├── handler/                # HTTP handlers
│   ├── models/                 # Domain models
│   ├── repository/             # Data access layer
│   ├── service/                # Business logic
│   └── queue/                  # Message queue integration
├── frontend/                   # React application
│   ├── src/components/         # React components
│   ├── src/services/          # API client
│   └── public/                # Static assets
├── scripts/                   # Database scripts
└── docker-compose.*.yml      # Docker configurations
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Run specific package tests
go test ./internal/service/...

# Integration tests (requires databases)
make test-integration
```

### Test Strategy

- **Unit Tests**: Mock repository interfaces for service testing
- **Integration Tests**: Real database connections for repository testing  
- **Feature Tests**: End-to-end API testing with Docker Compose
- **Mocking**: Uses testify/mock for clean test isolation

## 🚢 Deployment

### Production Deployment

1. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Deploy with Docker**:
   ```bash
   docker compose -f docker-compose.yml up -d
   ```

3. **Scale Transaction Processors**:
   ```bash
   docker compose up -d --scale transaction-processor=3
   ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_URL` | PostgreSQL connection string | `postgres://...` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://...` |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://...` |
| `API_PORT` | API Gateway port | `8080` |
| `MAX_RETRY_ATTEMPTS` | Transaction retry limit | `3` |

## 📊 Monitoring

### Health Checks

All services include health check endpoints:

- **API Gateway**: `GET /health`
- **Database Status**: `GET /health/db`
- **Queue Status**: `GET /health/queue`

### Logging

Structured JSON logging with:
- Correlation IDs for request tracing
- Transaction processing metrics
- Error tracking and alerting

### Metrics

Key metrics to monitor:
- Transaction processing time
- Queue depth and processing rate
- Database connection pool usage
- Error rates by service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- Follow Go conventions and use `gofmt`
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- Built with ❤️ using Go, React, and Docker
- Implements microservices best practices
- Follows SOLID principles and clean architecture
- Designed for high availability and scalability

---

**Banking System** - Secure, Reliable, Fast 🚀

For detailed technical documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)