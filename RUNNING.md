# How to Run the Banking System

## 🚀 Quick Start with Docker (Recommended)

The easiest way to run the complete system with all services:

```bash
# Build and start all services
make docker-up

# View logs
make docker-logs

# Stop all services
make docker-down
```

This starts:
- **API Gateway** on port `8080`
- **Transaction Processor** (2 replicas)
- **PostgreSQL** on port `5432`
- **MongoDB** on port `27017`
- **RabbitMQ** on port `5672` (Management UI on `15672`)

## 🛠 Local Development Setup

For development with hot reloading and debugging:

### Prerequisites
You need to have these services running locally:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- RabbitMQ (port 5672)

### Step 1: Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Install dependencies
make deps
```

### Step 2: Start Dependencies
You can run just the databases with Docker:
```bash
# Start only databases
docker compose up postgres mongodb rabbitmq -d
```

### Step 3: Run Services Locally
```bash
# Terminal 1: Run API Gateway
make run-api

# Terminal 2: Run Transaction Processor
make run-processor
```

## 📊 Service Endpoints

### API Gateway (Port 8080)
- **Health Check**: `GET http://localhost:8080/health`
- **Create Account**: `POST http://localhost:8080/api/v1/accounts`
- **Get Account**: `GET http://localhost:8080/api/v1/accounts/{id}`
- **List Accounts**: `GET http://localhost:8080/api/v1/accounts`
- **Create Transaction**: `POST http://localhost:8080/api/v1/transactions`
- **Get Transaction**: `GET http://localhost:8080/api/v1/transactions/{id}`
- **Transaction History**: `GET http://localhost:8080/api/v1/accounts/{id}/transactions`

### Management UIs
- **RabbitMQ Management**: `http://localhost:15672` (admin/admin)

## 🧪 Testing the API

### 1. Create an Account
```bash
curl -X POST http://localhost:8080/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "initial_balance": 100000,
    "currency": "USD"
  }'
```

### 2. Create a Deposit Transaction
```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "ACCOUNT_ID_FROM_STEP_1",
    "type": "deposit",
    "amount": 50000,
    "currency": "USD",
    "description": "Initial deposit"
  }'
```

### 3. Create a Withdrawal Transaction
```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "ACCOUNT_ID_FROM_STEP_1",
    "type": "withdrawal",
    "amount": 25000,
    "currency": "USD",
    "description": "ATM withdrawal"
  }'
```

### 4. Check Account Balance
```bash
curl http://localhost:8080/api/v1/accounts/ACCOUNT_ID_FROM_STEP_1
```

### 5. View Transaction History
```bash
curl http://localhost:8080/api/v1/accounts/ACCOUNT_ID_FROM_STEP_1/transactions
```

## 🔧 Development Commands

```bash
# Build applications
make build

# Run tests
make test

# Run tests with coverage
make test-coverage

# Format code
make fmt

# Run linter
make lint

# Clean build artifacts
make clean
```

## 🐛 Troubleshooting

### Service Won't Start
1. Check if ports are available: `lsof -i :8080`
2. Verify database connections in logs
3. Ensure environment variables are set correctly

### Database Connection Issues
1. Check if PostgreSQL is running: `docker ps | grep postgres`
2. Test MongoDB connection: `docker ps | grep mongo`
3. Verify RabbitMQ: `docker ps | grep rabbitmq`

### Transaction Processing Issues
1. Check RabbitMQ queue: Visit `http://localhost:15672`
2. View processor logs: `make docker-logs` or check terminal output
3. Verify account exists and has sufficient balance

## 📝 Important Notes

- **Monetary Values**: All amounts are in cents (e.g., 100000 = $1000.00)
- **Account Numbers**: Automatically generated 10-digit numbers
- **Transaction IDs**: UUIDs for tracking across services
- **Async Processing**: Transactions are queued and processed asynchronously
- **Retry Logic**: Failed transactions retry up to 3 times
- **Supported Currencies**: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR