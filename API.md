# Banking System API Documentation

This document describes the REST API endpoints for the Banking Ledger Service.

## Base URL
```
http://localhost:8080/api/v1
```

## Endpoints

### Health Check

#### GET /health
Check the health status of the API.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-12-07T10:30:00Z"
}
```

### Accounts

#### POST /accounts
Create a new bank account.

**Request Body:**
```json
{
  "name": "John Doe",
  "initial_balance": 100000,
  "currency": "USD"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "account_number": "1234567890",
  "name": "John Doe",
  "balance": 100000,
  "currency": "USD",
  "status": "active",
  "created_at": "2023-12-07T10:30:00Z",
  "updated_at": "2023-12-07T10:30:00Z"
}
```

#### GET /accounts
List all accounts with pagination.

**Query Parameters:**
- `limit` (optional): Number of accounts to return (default: 20, max: 100)
- `offset` (optional): Number of accounts to skip (default: 0)

**Response:**
```json
{
  "accounts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "account_number": "1234567890",
      "name": "John Doe",
      "balance": 100000,
      "currency": "USD",
      "status": "active",
      "created_at": "2023-12-07T10:30:00Z",
      "updated_at": "2023-12-07T10:30:00Z"
    }
  ],
  "limit": 20,
  "offset": 0,
  "count": 1
}
```

#### GET /accounts/:id
Get account details by ID.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "account_number": "1234567890",
  "name": "John Doe",
  "balance": 100000,
  "currency": "USD",
  "status": "active",
  "created_at": "2023-12-07T10:30:00Z",
  "updated_at": "2023-12-07T10:30:00Z"
}
```

#### GET /accounts/number/:number
Get account details by account number.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "account_number": "1234567890",
  "name": "John Doe",
  "balance": 100000,
  "currency": "USD",
  "status": "active",
  "created_at": "2023-12-07T10:30:00Z",
  "updated_at": "2023-12-07T10:30:00Z"
}
```

### Transactions

#### POST /transactions
Create a new transaction.

**Request Body:**
```json
{
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "deposit",
  "amount": 50000,
  "currency": "USD",
  "description": "Salary deposit",
  "metadata": {
    "source": "payroll",
    "employee_id": "EMP001"
  }
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "transaction_id": "660e8400-e29b-41d4-a716-446655440000",
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "deposit",
  "amount": 50000,
  "currency": "USD",
  "description": "Salary deposit",
  "status": "pending",
  "created_at": "2023-12-07T10:30:00Z",
  "metadata": {
    "source": "payroll",
    "employee_id": "EMP001"
  }
}
```

#### GET /transactions/:id
Get transaction details by ID (supports both MongoDB ObjectID and Transaction UUID).

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "transaction_id": "660e8400-e29b-41d4-a716-446655440000",
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "deposit",
  "amount": 50000,
  "currency": "USD",
  "description": "Salary deposit",
  "status": "processed",
  "created_at": "2023-12-07T10:30:00Z",
  "processed_at": "2023-12-07T10:30:15Z",
  "metadata": {
    "source": "payroll",
    "employee_id": "EMP001"
  }
}
```

#### GET /accounts/:accountId/transactions
Get transaction history for an account.

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 20, max: 100)
- `offset` (optional): Number of transactions to skip (default: 0)

**Response:**
```json
{
  "transactions": [
    {
      "id": "507f1f77bcf86cd799439011",
      "transaction_id": "660e8400-e29b-41d4-a716-446655440000",
      "account_id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "deposit",
      "amount": 50000,
      "currency": "USD",
      "description": "Salary deposit",
      "status": "processed",
      "created_at": "2023-12-07T10:30:00Z",
      "processed_at": "2023-12-07T10:30:15Z"
    }
  ],
  "limit": 20,
  "offset": 0,
  "count": 1
}
```

## Transaction Types

- `deposit`: Add funds to an account
- `withdrawal`: Remove funds from an account
- `transfer`: Transfer funds between accounts (not yet implemented)

## Transaction Status

- `pending`: Transaction is queued for processing
- `processed`: Transaction has been successfully processed
- `failed`: Transaction processing failed
- `cancelled`: Transaction was cancelled

## Account Status

- `active`: Account is active and can process transactions
- `suspended`: Account is temporarily suspended
- `closed`: Account is permanently closed

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Currency Support

The system supports the following currencies:
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- CHF (Swiss Franc)
- CNY (Chinese Yuan)
- INR (Indian Rupee)

## Amount Format

All monetary amounts are represented in the smallest currency unit (e.g., cents for USD) to avoid floating-point precision issues.

Example:
- $100.00 USD = 10000 (cents)
- €50.50 EUR = 5050 (euro cents)

## Rate Limiting

The API implements basic rate limiting to prevent abuse. Current limits:
- 1000 requests per minute per IP address
- 100 transaction creations per minute per IP address