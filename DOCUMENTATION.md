# 📚 Banking Ledger System - Technical Documentation

This document provides comprehensive technical documentation for the Banking Ledger System, including architecture details, API specifications, deployment guides, and development best practices.

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Message Queue Design](#message-queue-design)
- [Configuration Management](#configuration-management)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Performance & Scaling](#performance--scaling)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)

## 🏗️ System Architecture

### Microservices Overview

The system follows a distributed microservices pattern with clear separation of concerns:

#### Core Services

1. **API Gateway** (`cmd/api-gateway/`)
   - REST API server using Gin framework
   - Handles HTTP requests and validation
   - Manages CORS and middleware
   - Port: 8080

2. **Transaction Processor** (`cmd/transaction-processor/`)
   - Background worker processing transactions
   - Consumes messages from RabbitMQ
   - Implements retry logic with exponential backoff
   - Scalable horizontally

3. **Frontend** (`frontend/`)
   - React 18.2+ SPA with modern UI
   - Nginx-served static build
   - Real-time dashboard updates
   - Port: 3000

#### Data Stores

1. **PostgreSQL** - ACID-compliant account balances
2. **MongoDB** - Transaction logs and audit trails  
3. **RabbitMQ** - Message queue for async processing

### Design Patterns

#### Repository Pattern
```go
type AccountRepository interface {
    Create(account *models.Account) error
    GetByID(id string) (*models.Account, error)
    ListAll() ([]*models.Account, error)
    UpdateBalance(id string, amount int64) error
}
```

#### Service Layer Pattern
```go
type AccountService struct {
    repo AccountRepository
    logger *logrus.Logger
}
```

#### Message Queue Pattern
```go
type TransactionMessage struct {
    TransactionID string `json:"transaction_id"`
    AccountID     string `json:"account_id"`
    Amount        int64  `json:"amount"`
    Type          string `json:"type"`
}
```

## 🌐 API Reference

### Authentication & Headers

All requests should include:
```http
Content-Type: application/json
Accept: application/json
```

### Account Management

#### Create Account
```http
POST /api/v1/accounts
```

**Request Body:**
```json
{
  "name": "John Doe",
  "currency": "USD",
  "initial_balance": 1000.00
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "account_number": "1234567890",
  "name": "John Doe",
  "currency": "USD",
  "balance": 100000,
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters
- `currency`: Required, must be one of: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR
- `initial_balance`: Optional, defaults to 0.00, minimum 0.00

#### Get All Accounts
```http
GET /api/v1/accounts
```

**Response:**
```json
{
  "accounts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "account_number": "1234567890",
      "name": "John Doe",
      "currency": "USD",
      "balance": 100000,
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Account by ID
```http
GET /api/v1/accounts/{account_id}
```

**Path Parameters:**
- `account_id`: UUID of the account

### Transaction Management

#### Create Transaction
```http
POST /api/v1/transactions
```

**Request Body:**
```json
{
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "deposit",
  "amount": 500.00,
  "description": "Salary deposit"
}
```

**Response:**
```json
{
  "transaction_id": "660f9511-f30c-52e5-b827-557766551001",
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "deposit",
  "amount": 50000,
  "currency": "USD",
  "description": "Salary deposit",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Transaction Types:**
- `deposit`: Add funds to account
- `withdrawal`: Remove funds from account

**Validation Rules:**
- `account_id`: Required, must be valid UUID
- `type`: Required, must be "deposit" or "withdrawal"
- `amount`: Required, must be positive
- `description`: Optional, max 255 characters

#### Get Transaction History
```http
GET /api/v1/transactions?account_id={id}&limit={limit}&offset={offset}
```

**Query Parameters:**
- `account_id`: Optional, filter by account ID
- `limit`: Optional, default 50, max 100
- `offset`: Optional, default 0

**Response:**
```json
{
  "transactions": [
    {
      "transaction_id": "660f9511-f30c-52e5-b827-557766551001",
      "account_id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "deposit",
      "amount": 50000,
      "currency": "USD",
      "description": "Salary deposit",
      "status": "completed",
      "created_at": "2024-01-01T00:00:00Z",
      "processed_at": "2024-01-01T00:00:01Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Dashboard API

#### Get Dashboard Data
```http
GET /api/v1/dashboard
```

**Response:**
```json
{
  "stats": {
    "total_accounts": 5,
    "balances_by_currency": {
      "USD": 250000,
      "EUR": 180000,
      "GBP": 120000
    },
    "recent_transactions_count": 12
  },
  "recent_accounts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "account_number": "1234567890",
      "name": "John Doe",
      "currency": "USD",
      "balance": 100000,
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "recent_transactions": [
    {
      "transaction_id": "660f9511-f30c-52e5-b827-557766551001",
      "account_id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "deposit",
      "amount": 50000,
      "currency": "USD",
      "description": "Salary deposit",
      "status": "completed",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Health Check

#### System Health
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "queue": "healthy"
  }
}
```

### Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Account has insufficient funds for this withdrawal",
    "details": {
      "account_id": "550e8400-e29b-41d4-a716-446655440000",
      "requested_amount": 50000,
      "available_balance": 25000
    }
  }
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (insufficient funds, etc.)
- `500`: Internal Server Error

## 🗄️ Database Schema

### PostgreSQL Schema (Account Balances)

```sql
-- Accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0, -- Stored in cents
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_accounts_currency ON accounts(currency);
CREATE INDEX idx_accounts_status ON accounts(status);
```

### MongoDB Schema (Transaction Logs)

```javascript
// Transactions collection
{
  _id: ObjectId,
  transaction_id: "UUID string",
  account_id: "UUID string",
  type: "deposit|withdrawal",
  amount: NumberLong, // Stored in cents
  currency: "USD|EUR|...",
  description: "string",
  status: "pending|completed|failed",
  created_at: ISODate,
  processed_at: ISODate,
  retry_count: NumberInt,
  error_message: "string" // Only for failed transactions
}

// Indexes
db.transactions.createIndex({ "account_id": 1, "created_at": -1 })
db.transactions.createIndex({ "transaction_id": 1 }, { unique: true })
db.transactions.createIndex({ "status": 1, "created_at": 1 })
```

## 📨 Message Queue Design

### RabbitMQ Configuration

#### Exchange and Queue Setup
```go
// Exchange: transactions (direct)
// Queue: transactions.processing
// Routing Key: transaction.process

type TransactionMessage struct {
    TransactionID string `json:"transaction_id"`
    AccountID     string `json:"account_id"`
    Type          string `json:"type"`
    Amount        int64  `json:"amount"`
    Currency      string `json:"currency"`
    Description   string `json:"description"`
    CreatedAt     time.Time `json:"created_at"`
}
```

#### Message Flow
1. API Gateway receives transaction request
2. Transaction saved to MongoDB with "pending" status
3. Message published to RabbitMQ
4. Transaction Processor consumes message
5. Balance validation and update in PostgreSQL
6. Transaction status updated in MongoDB

#### Retry Logic
```go
const (
    MaxRetryAttempts = 3
    InitialRetryDelay = 1 * time.Second
    MaxRetryDelay = 30 * time.Second
)

// Exponential backoff with jitter
func calculateRetryDelay(attempt int) time.Duration {
    delay := InitialRetryDelay * time.Duration(math.Pow(2, float64(attempt)))
    if delay > MaxRetryDelay {
        delay = MaxRetryDelay
    }
    // Add jitter ±25%
    jitter := time.Duration(rand.Float64() * 0.5 * float64(delay))
    return delay + jitter - delay/4
}
```

## ⚙️ Configuration Management

### Environment Variables

#### Database Configuration
```bash
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=banking_system
POSTGRES_USER=banking_user
POSTGRES_PASSWORD=banking_password
POSTGRES_SSL_MODE=disable
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=300s

# MongoDB
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=banking_logs
MONGODB_USERNAME=banking_user
MONGODB_PASSWORD=banking_password

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
TRANSACTION_QUEUE=transactions
```

#### Application Configuration
```bash
# API Gateway
API_PORT=8080
API_HOST=0.0.0.0
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Transaction Processor
PROCESSOR_WORKERS=3
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_SECONDS=1

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Configuration Loading
```go
type Config struct {
    Database struct {
        PostgresURL string `env:"POSTGRES_URL"`
        MongoURL    string `env:"MONGODB_URL"`
    }
    Queue struct {
        RabbitMQURL string `env:"RABBITMQ_URL"`
        QueueName   string `env:"TRANSACTION_QUEUE" envDefault:"transactions"`
    }
    API struct {
        Port         string `env:"API_PORT" envDefault:"8080"`
        AllowedOrigins []string `env:"CORS_ALLOWED_ORIGINS" envSeparator:","`
    }
}
```

## 🚨 Error Handling

### Error Categories

#### Validation Errors (400)
```go
type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
    Value   interface{} `json:"value,omitempty"`
}

type ValidationErrorResponse struct {
    Error struct {
        Code    string            `json:"code"`
        Message string            `json:"message"`
        Details []ValidationError `json:"details"`
    } `json:"error"`
}
```

#### Business Logic Errors (409)
```go
var (
    ErrInsufficientFunds = errors.New("insufficient funds")
    ErrAccountNotFound   = errors.New("account not found")
    ErrInvalidCurrency   = errors.New("invalid currency")
    ErrAccountInactive   = errors.New("account is inactive")
)
```

#### System Errors (500)
```go
type SystemError struct {
    Code       string `json:"code"`
    Message    string `json:"message"`
    Internal   error  `json:"-"`
    RequestID  string `json:"request_id,omitempty"`
    Timestamp  time.Time `json:"timestamp"`
}
```

### Error Recovery Strategies

#### Database Connection Failures
- Automatic reconnection with exponential backoff
- Circuit breaker pattern for external dependencies
- Graceful degradation for non-critical operations

#### Message Queue Failures
- Dead letter queue for failed messages
- Retry with exponential backoff
- Manual intervention queue for critical failures

#### Transaction Processing Failures
- Automatic retry for temporary failures
- Manual review for business logic failures
- Compensation transactions for partial failures

## 🔒 Security Considerations

### Data Protection

#### Sensitive Data Handling
- All monetary values stored as integers (cents) to avoid floating-point precision issues
- Account numbers generated with cryptographically secure random numbers
- No sensitive data in logs (amounts are logged but account details are redacted)

#### Database Security
```sql
-- Row-level security for account access
CREATE POLICY account_access ON accounts
    FOR ALL TO banking_user
    USING (true); -- Customize based on authentication context

-- Audit logging
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50),
    operation VARCHAR(10),
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### API Security Headers
```go
// CORS configuration
config := cors.Config{
    AllowOrigins:     []string{os.Getenv("FRONTEND_URL")},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
    AllowCredentials: true,
    MaxAge:          12 * time.Hour,
}

// Security headers middleware
func SecurityHeaders() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("X-Content-Type-Options", "nosniff")
        c.Header("X-Frame-Options", "DENY")
        c.Header("X-XSS-Protection", "1; mode=block")
        c.Next()
    }
}
```

### Input Validation

#### Request Validation
```go
type CreateAccountRequest struct {
    Name           string  `json:"name" binding:"required,min=2,max=100"`
    Currency       string  `json:"currency" binding:"required,currency"`
    InitialBalance float64 `json:"initial_balance" binding:"min=0"`
}

// Custom validators
func validateCurrency(fl validator.FieldLevel) bool {
    validCurrencies := []string{"USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"}
    currency := fl.Field().String()
    for _, valid := range validCurrencies {
        if currency == valid {
            return true
        }
    }
    return false
}
```

## 📈 Performance & Scaling

### Database Optimization

#### PostgreSQL Performance
```sql
-- Optimized queries with proper indexes
EXPLAIN ANALYZE SELECT * FROM accounts WHERE currency = 'USD' AND status = 'active';

-- Connection pooling configuration
POSTGRES_MAX_OPEN_CONNS=25
POSTGRES_MAX_IDLE_CONNS=5
POSTGRES_CONN_MAX_LIFETIME=300s

-- Query timeout settings
POSTGRES_QUERY_TIMEOUT=30s
```

#### MongoDB Performance
```javascript
// Compound indexes for common queries
db.transactions.createIndex({ 
  "account_id": 1, 
  "created_at": -1 
}, { 
  name: "account_created_idx" 
})

// Partial indexes for active transactions
db.transactions.createIndex(
  { "status": 1, "created_at": 1 },
  { partialFilterExpression: { "status": { $in: ["pending", "processing"] } } }
)
```

### Horizontal Scaling

#### Transaction Processor Scaling
```yaml
# docker-compose scaling
docker compose up -d --scale transaction-processor=5

# Kubernetes scaling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: transaction-processor
spec:
  replicas: 5
  template:
    spec:
      containers:
      - name: transaction-processor
        image: banking-system-transaction-processor
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

#### Load Balancing
```nginx
upstream api_backend {
    server api-gateway-1:8080;
    server api-gateway-2:8080;
    server api-gateway-3:8080;
    keepalive 32;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

### Caching Strategy

#### Redis for Session Management
```go
type CacheConfig struct {
    RedisURL        string
    DefaultTTL      time.Duration
    SessionTTL      time.Duration
    MaxConnections  int
}

// Cache frequently accessed account data
func (s *AccountService) GetAccountWithCache(id string) (*models.Account, error) {
    // Check cache first
    if cached := s.cache.Get(fmt.Sprintf("account:%s", id)); cached != nil {
        return cached.(*models.Account), nil
    }
    
    // Fetch from database
    account, err := s.repo.GetByID(id)
    if err != nil {
        return nil, err
    }
    
    // Cache for future requests
    s.cache.Set(fmt.Sprintf("account:%s", id), account, s.config.DefaultTTL)
    return account, nil
}
```

## 🚀 Deployment Guide

### Production Deployment

#### Docker Compose Production
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api-gateway:
    image: banking-system-api-gateway:latest
    ports:
      - "8080:8080"
    environment:
      - POSTGRES_URL=${POSTGRES_URL}
      - MONGODB_URL=${MONGODB_URL}
      - RABBITMQ_URL=${RABBITMQ_URL}
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    
  transaction-processor:
    image: banking-system-transaction-processor:latest
    deploy:
      replicas: 3
    environment:
      - POSTGRES_URL=${POSTGRES_URL}
      - MONGODB_URL=${MONGODB_URL}
      - RABBITMQ_URL=${RABBITMQ_URL}
    restart: unless-stopped
```

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: banking-system-api-gateway:latest
        ports:
        - containerPort: 8080
        env:
        - name: POSTGRES_URL
          valueFrom:
            secretKeyRef:
              name: banking-secrets
              key: postgres-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Monitoring & Observability

#### Prometheus Metrics
```go
// Custom metrics
var (
    transactionDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "transaction_processing_duration_seconds",
            Help: "Time spent processing transactions",
        },
        []string{"type", "status"},
    )
    
    accountBalance = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "account_balance_total",
            Help: "Current account balances by currency",
        },
        []string{"currency"},
    )
)
```

#### Health Check Implementation
```go
type HealthChecker struct {
    db    *gorm.DB
    mongo *mongo.Client
    queue *amqp.Connection
}

func (h *HealthChecker) Check() HealthStatus {
    status := HealthStatus{
        Status:    "healthy",
        Timestamp: time.Now(),
        Services:  make(map[string]string),
    }
    
    // Check PostgreSQL
    if err := h.db.DB().Ping(); err != nil {
        status.Services["postgres"] = "unhealthy"
        status.Status = "degraded"
    } else {
        status.Services["postgres"] = "healthy"
    }
    
    // Check MongoDB
    if err := h.mongo.Ping(context.Background(), readpref.Primary()); err != nil {
        status.Services["mongodb"] = "unhealthy"
        status.Status = "degraded"
    } else {
        status.Services["mongodb"] = "healthy"
    }
    
    // Check RabbitMQ
    if h.queue.IsClosed() {
        status.Services["rabbitmq"] = "unhealthy"
        status.Status = "degraded"
    } else {
        status.Services["rabbitmq"] = "healthy"
    }
    
    return status
}
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL connectivity
docker exec -it banking-postgres psql -U banking_user -d banking_system -c "SELECT 1;"

# Check MongoDB connectivity
docker exec -it banking-mongo mongo --eval "db.adminCommand('ping')"

# Check connection pool exhaustion
grep "connection pool" /var/log/banking-api.log | tail -20
```

#### Message Queue Issues
```bash
# Check RabbitMQ status
docker exec -it banking-rabbitmq rabbitmqctl status

# Check queue depth
docker exec -it banking-rabbitmq rabbitmqctl list_queues name messages

# Purge stuck messages
docker exec -it banking-rabbitmq rabbitmqctl purge_queue transactions
```

#### Performance Issues
```bash
# Check slow queries in PostgreSQL
docker exec -it banking-postgres psql -U banking_user -d banking_system -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;"

# Check MongoDB slow operations
docker exec -it banking-mongo mongo --eval "db.runCommand({profile: 2, slowms: 100})"

# Monitor system resources
docker stats banking-api-gateway banking-transaction-processor
```

### Log Analysis

#### Structured Logging Format
```json
{
  "level": "info",
  "timestamp": "2024-01-01T00:00:00Z",
  "message": "Transaction processed successfully",
  "fields": {
    "transaction_id": "660f9511-f30c-52e5-b827-557766551001",
    "account_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 50000,
    "type": "deposit",
    "processing_time_ms": 150,
    "correlation_id": "req-123456"
  }
}
```

#### Log Aggregation Queries
```bash
# Find all failed transactions in the last hour
grep -A 5 -B 5 '"level":"error"' /var/log/banking-processor.log | grep "$(date -d '1 hour ago' '+%Y-%m-%d')"

# Analyze transaction processing times
grep "Transaction processed" /var/log/banking-processor.log | jq '.fields.processing_time_ms' | sort -n | tail -10

# Check for duplicate transaction processing
grep "transaction_id" /var/log/banking-processor.log | sort | uniq -d
```

### Recovery Procedures

#### Database Recovery
```bash
# PostgreSQL backup
docker exec banking-postgres pg_dump -U banking_user banking_system > backup.sql

# PostgreSQL restore
docker exec -i banking-postgres psql -U banking_user banking_system < backup.sql

# MongoDB backup
docker exec banking-mongo mongodump --host localhost --db banking_logs --out /backup

# MongoDB restore
docker exec banking-mongo mongorestore --host localhost --db banking_logs /backup/banking_logs
```

#### Message Queue Recovery
```bash
# Export RabbitMQ definitions
docker exec banking-rabbitmq rabbitmqctl export_definitions /tmp/definitions.json

# Import RabbitMQ definitions
docker exec banking-rabbitmq rabbitmqctl import_definitions /tmp/definitions.json

# Restart message processing
docker restart banking-transaction-processor
```

---

This documentation is maintained alongside the codebase and should be updated with any architectural changes or new features.