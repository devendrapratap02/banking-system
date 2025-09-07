package service

import (
	"context"
	"fmt"
	"time"

	"banking-system/internal/models"
	"banking-system/internal/queue"
	"banking-system/internal/repository"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TransactionService defines the interface for transaction business logic
type TransactionService interface {
	CreateTransaction(ctx context.Context, req *models.TransactionRequest) (*models.Transaction, error)
	GetTransaction(ctx context.Context, id primitive.ObjectID) (*models.Transaction, error)
	GetTransactionByID(ctx context.Context, transactionID uuid.UUID) (*models.Transaction, error)
	GetTransactionHistory(ctx context.Context, accountID uuid.UUID, limit, offset int) ([]*models.Transaction, error)
	GetTransactions(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]*models.Transaction, int64, error)
	ProcessTransaction(ctx context.Context, msg *models.TransactionMessage) error
}

// transactionService implements TransactionService
type transactionService struct {
	transactionRepo repository.TransactionRepository
	accountRepo     repository.AccountRepository
	queue           *queue.RabbitMQ
}

// NewTransactionService creates a new transaction service
func NewTransactionService(
	transactionRepo repository.TransactionRepository,
	accountRepo repository.AccountRepository,
	queue *queue.RabbitMQ,
) TransactionService {
	return &transactionService{
		transactionRepo: transactionRepo,
		accountRepo:     accountRepo,
		queue:           queue,
	}
}

// CreateTransaction creates a new transaction and queues it for processing
func (s *transactionService) CreateTransaction(ctx context.Context, req *models.TransactionRequest) (*models.Transaction, error) {
	// Validate account exists
	account, err := s.accountRepo.GetByID(ctx, req.AccountID)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}
	if account == nil {
		return nil, fmt.Errorf("account not found")
	}

	// Note: Account status validation disabled as Status field is not currently in the model
	// TODO: Re-enable when Status field is added back to Account model
	// if account.Status != models.AccountStatusActive {
	//     return nil, fmt.Errorf("account is not active")
	// }

	// Validate currency match
	if account.Currency != req.Currency {
		return nil, fmt.Errorf("currency mismatch: account currency is %s, transaction currency is %s", account.Currency, req.Currency)
	}

	// For withdrawals, check sufficient balance
	if req.Type == models.TransactionTypeWithdrawal && account.Balance < req.Amount {
		return nil, fmt.Errorf("insufficient balance")
	}

	// Create transaction record
	transaction := &models.Transaction{
		TransactionID: uuid.New(),
		AccountID:     req.AccountID,
		Type:          req.Type,
		Amount:        req.Amount,
		Currency:      req.Currency,
		Description:   req.Description,
		Status:        models.TransactionStatusPending,
		Metadata:      req.Metadata,
	}

	if err := s.transactionRepo.Create(ctx, transaction); err != nil {
		logrus.WithError(err).Error("Failed to create transaction")
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	// Queue transaction for processing
	msg := &models.TransactionMessage{
		TransactionID: transaction.TransactionID,
		AccountID:     req.AccountID,
		Type:          req.Type,
		Amount:        req.Amount,
		Currency:      req.Currency,
		Description:   req.Description,
		Metadata:      req.Metadata,
		RetryCount:    0,
		CreatedAt:     time.Now(),
	}

	if err := s.queue.PublishTransaction(ctx, msg); err != nil {
		logrus.WithError(err).Error("Failed to queue transaction")
		// Update transaction status to failed
		transaction.Status = models.TransactionStatusFailed
		transaction.FailureReason = "Failed to queue transaction"
		s.transactionRepo.Update(ctx, transaction)
		return nil, fmt.Errorf("failed to queue transaction: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"transaction_id": transaction.TransactionID,
		"account_id":     req.AccountID,
		"type":           req.Type,
		"amount":         req.Amount,
	}).Info("Transaction created and queued")

	return transaction, nil
}

// GetTransaction retrieves a transaction by MongoDB ObjectID
func (s *transactionService) GetTransaction(ctx context.Context, id primitive.ObjectID) (*models.Transaction, error) {
	transaction, err := s.transactionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}
	if transaction == nil {
		return nil, fmt.Errorf("transaction not found")
	}
	return transaction, nil
}

// GetTransactionByID retrieves a transaction by transaction ID
func (s *transactionService) GetTransactionByID(ctx context.Context, transactionID uuid.UUID) (*models.Transaction, error) {
	transaction, err := s.transactionRepo.GetByTransactionID(ctx, transactionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}
	if transaction == nil {
		return nil, fmt.Errorf("transaction not found")
	}
	return transaction, nil
}

// GetTransactionHistory retrieves transaction history for an account
func (s *transactionService) GetTransactionHistory(ctx context.Context, accountID uuid.UUID, limit, offset int) ([]*models.Transaction, error) {
	if limit <= 0 || limit > 100 {
		limit = 20 // Default limit
	}

	transactions, err := s.transactionRepo.GetByAccountID(ctx, accountID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction history: %w", err)
	}

	return transactions, nil
}

// GetTransactions retrieves all transactions with optional filters and pagination
func (s *transactionService) GetTransactions(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]*models.Transaction, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 20 // Default limit
	}

	transactions, total, err := s.transactionRepo.GetAll(ctx, filters, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get transactions: %w", err)
	}

	return transactions, total, nil
}

// ProcessTransaction processes a transaction message from the queue
func (s *transactionService) ProcessTransaction(ctx context.Context, msg *models.TransactionMessage) error {
	logrus.WithFields(logrus.Fields{
		"transaction_id": msg.TransactionID,
		"account_id":     msg.AccountID,
		"type":           msg.Type,
		"amount":         msg.Amount,
		"retry_count":    msg.RetryCount,
	}).Info("Processing transaction")

	// Get the transaction record
	transaction, err := s.transactionRepo.GetByTransactionID(ctx, msg.TransactionID)
	if err != nil {
		return fmt.Errorf("failed to get transaction: %w", err)
	}
	if transaction == nil {
		return fmt.Errorf("transaction not found")
	}

	// Skip if already processed
	if transaction.Status == models.TransactionStatusProcessed {
		logrus.WithField("transaction_id", msg.TransactionID).Info("Transaction already processed")
		return nil
	}

	// Get account with latest balance
	account, err := s.accountRepo.GetByID(ctx, msg.AccountID)
	if err != nil {
		return s.markTransactionFailed(ctx, transaction, fmt.Sprintf("Failed to get account: %v", err))
	}
	if account == nil {
		return s.markTransactionFailed(ctx, transaction, "Account not found")
	}

	// Calculate new balance
	var newBalance int64
	switch msg.Type {
	case models.TransactionTypeDeposit:
		newBalance = account.Balance + msg.Amount
	case models.TransactionTypeWithdrawal:
		if account.Balance < msg.Amount {
			return s.markTransactionFailed(ctx, transaction, "Insufficient balance")
		}
		newBalance = account.Balance - msg.Amount
	default:
		return s.markTransactionFailed(ctx, transaction, "Invalid transaction type")
	}

	// Update account balance
	if err := s.accountRepo.UpdateBalance(ctx, msg.AccountID, newBalance); err != nil {
		return fmt.Errorf("failed to update account balance: %w", err)
	}

	// Mark transaction as processed
	now := time.Now()
	transaction.Status = models.TransactionStatusProcessed
	transaction.ProcessedAt = &now

	if err := s.transactionRepo.Update(ctx, transaction); err != nil {
		logrus.WithError(err).Error("Failed to update transaction status")
		// This is a critical error - the balance was updated but transaction status wasn't
		// In a real system, you'd want to implement compensation logic
		return fmt.Errorf("critical error: failed to update transaction status after balance update: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"transaction_id": msg.TransactionID,
		"account_id":     msg.AccountID,
		"old_balance":    account.Balance,
		"new_balance":    newBalance,
	}).Info("Transaction processed successfully")

	return nil
}

// markTransactionFailed marks a transaction as failed
func (s *transactionService) markTransactionFailed(ctx context.Context, transaction *models.Transaction, reason string) error {
	transaction.Status = models.TransactionStatusFailed
	transaction.FailureReason = reason
	
	if err := s.transactionRepo.Update(ctx, transaction); err != nil {
		logrus.WithError(err).Error("Failed to mark transaction as failed")
	}
	
	return fmt.Errorf("transaction failed: %s", reason)
}