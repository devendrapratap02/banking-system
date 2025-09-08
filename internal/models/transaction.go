package models

import (
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Transaction represents a transaction in the system
type Transaction struct {
	ID            primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	TransactionID uuid.UUID          `json:"transaction_id" bson:"transaction_id"`
	AccountID     uuid.UUID          `json:"account_id" bson:"account_id"`
	Type          TransactionType    `json:"type" bson:"type"`
	Amount        int64              `json:"amount" bson:"amount"` // Amount in cents
	Currency      string             `json:"currency" bson:"currency"`
	Description   string             `json:"description" bson:"description"`
	Status        TransactionStatus  `json:"status" bson:"status"`
	CreatedAt     time.Time          `json:"created_at" bson:"created_at"`
	ProcessedAt   *time.Time         `json:"processed_at,omitempty" bson:"processed_at,omitempty"`
	FailureReason string             `json:"failure_reason,omitempty" bson:"failure_reason,omitempty"`
	Metadata      map[string]string  `json:"metadata,omitempty" bson:"metadata,omitempty"`
}

type TransactionType string

const (
	TransactionTypeDeposit    TransactionType = "deposit"
	TransactionTypeWithdrawal TransactionType = "withdrawal"
	TransactionTypeTransfer   TransactionType = "transfer"
)

type TransactionStatus string

const (
	TransactionStatusPending   TransactionStatus = "pending"
	TransactionStatusProcessed TransactionStatus = "processed"
	TransactionStatusFailed    TransactionStatus = "failed"
	TransactionStatusCancelled TransactionStatus = "cancelled"
)

// TransactionRequest represents the request payload for creating a transaction
type TransactionRequest struct {
	AccountID   uuid.UUID         `json:"account_id" binding:"required"`
	Type        TransactionType   `json:"type" binding:"required,oneof=deposit withdrawal transfer"`
	Amount      int64             `json:"amount" binding:"required,min=1"`
	Currency    string            `json:"currency" binding:"required,len=3"`
	Description string            `json:"description" binding:"max=255"`
	Metadata    map[string]string `json:"metadata"`
}

// TransactionResponse represents the response payload for transaction operations
type TransactionResponse struct {
	ID            primitive.ObjectID `json:"id"`
	TransactionID uuid.UUID          `json:"transaction_id"`
	AccountID     uuid.UUID          `json:"account_id"`
	Type          TransactionType    `json:"type"`
	Amount        int64              `json:"amount"`
	Currency      string             `json:"currency"`
	Description   string             `json:"description"`
	Status        TransactionStatus  `json:"status"`
	CreatedAt     time.Time          `json:"created_at"`
	ProcessedAt   *time.Time         `json:"processed_at,omitempty"`
	FailureReason string             `json:"failure_reason,omitempty"`
	Metadata      map[string]string  `json:"metadata,omitempty"`
}

// ToResponse converts Transaction to TransactionResponse
func (t *Transaction) ToResponse() *TransactionResponse {
	return &TransactionResponse{
		ID:            t.ID,
		TransactionID: t.TransactionID,
		AccountID:     t.AccountID,
		Type:          t.Type,
		Amount:        t.Amount,
		Currency:      t.Currency,
		Description:   t.Description,
		Status:        t.Status,
		CreatedAt:     t.CreatedAt,
		ProcessedAt:   t.ProcessedAt,
		FailureReason: t.FailureReason,
		Metadata:      t.Metadata,
	}
}

// TransactionMessage represents a message sent to the queue for processing
type TransactionMessage struct {
	TransactionID uuid.UUID         `json:"transaction_id"`
	AccountID     uuid.UUID         `json:"account_id"`
	Type          TransactionType   `json:"type"`
	Amount        int64             `json:"amount"`
	Currency      string            `json:"currency"`
	Description   string            `json:"description"`
	Metadata      map[string]string `json:"metadata"`
	RetryCount    int               `json:"retry_count"`
	CreatedAt     time.Time         `json:"created_at"`
}
