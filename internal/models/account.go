package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Account represents a bank account in the relational database
type Account struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key"`
	Number    string         `json:"account_number" gorm:"column:account_number;uniqueIndex;not null"`
	Name      string         `json:"name" gorm:"not null"`
	Balance   int64          `json:"balance" gorm:"not null;default:0"` // Balance in cents to avoid floating point issues
	Currency  string         `json:"currency" gorm:"not null;default:'USD'"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type AccountStatus string

const (
	AccountStatusActive   AccountStatus = "active"
	AccountStatusSuspended AccountStatus = "suspended"
	AccountStatusClosed   AccountStatus = "closed"
)

// BeforeCreate hook to generate UUID
func (a *Account) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// CreateAccountRequest represents the request payload for creating an account
type CreateAccountRequest struct {
	Name           string `json:"name" binding:"required,min=2,max=100"`
	InitialBalance int64  `json:"initial_balance" binding:"min=0"`
	Currency       string `json:"currency" binding:"required,len=3"`
}

// AccountResponse represents the response payload for account operations
type AccountResponse struct {
	ID            uuid.UUID `json:"id"`
	Number        string    `json:"account_number"`
	Name          string    `json:"name"`
	Balance       int64     `json:"balance"`
	Currency      string    `json:"currency"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ToResponse converts Account to AccountResponse
func (a *Account) ToResponse() *AccountResponse {
	return &AccountResponse{
		ID:        a.ID,
		Number:    a.Number,
		Name:      a.Name,
		Balance:   a.Balance,
		Currency:  a.Currency,
		CreatedAt: a.CreatedAt,
		UpdatedAt: a.UpdatedAt,
	}
}