package service

import (
	"context"
	"fmt"

	"banking-system/internal/models"
	"banking-system/internal/repository"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// AccountService defines the interface for account business logic
type AccountService interface {
	CreateAccount(ctx context.Context, req *models.CreateAccountRequest) (*models.Account, error)
	GetAccount(ctx context.Context, id uuid.UUID) (*models.Account, error)
	GetAccountByNumber(ctx context.Context, number string) (*models.Account, error)
	ListAccounts(ctx context.Context, limit, offset int) ([]*models.Account, error)
}

// accountService implements AccountService
type accountService struct {
	accountRepo repository.AccountRepository
}

// NewAccountService creates a new account service
func NewAccountService(accountRepo repository.AccountRepository) AccountService {
	return &accountService{
		accountRepo: accountRepo,
	}
}

// CreateAccount creates a new account
func (s *accountService) CreateAccount(ctx context.Context, req *models.CreateAccountRequest) (*models.Account, error) {
	// Validate currency (basic validation)
	if !isValidCurrency(req.Currency) {
		return nil, fmt.Errorf("invalid currency: %s", req.Currency)
	}

	account := &models.Account{
		ID:       uuid.New(),
		Name:     req.Name,
		Balance:  req.InitialBalance,
		Currency: req.Currency,
	}

	if err := s.accountRepo.Create(ctx, account); err != nil {
		logrus.WithError(err).Error("Failed to create account")
		return nil, fmt.Errorf("failed to create account: %w", err)
	}

	logrus.WithFields(logrus.Fields{
		"account_id": account.ID,
		"number":     account.Number,
	}).Info("Account created successfully")

	return account, nil
}

// GetAccount retrieves an account by ID
func (s *accountService) GetAccount(ctx context.Context, id uuid.UUID) (*models.Account, error) {
	account, err := s.accountRepo.GetByID(ctx, id)
	if err != nil {
		logrus.WithError(err).WithField("account_id", id).Error("Failed to get account")
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	if account == nil {
		return nil, fmt.Errorf("account not found")
	}

	return account, nil
}

// GetAccountByNumber retrieves an account by account number
func (s *accountService) GetAccountByNumber(ctx context.Context, number string) (*models.Account, error) {
	account, err := s.accountRepo.GetByNumber(ctx, number)
	if err != nil {
		logrus.WithError(err).WithField("account_number", number).Error("Failed to get account by number")
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	if account == nil {
		return nil, fmt.Errorf("account not found")
	}

	return account, nil
}

// ListAccounts retrieves accounts with pagination
func (s *accountService) ListAccounts(ctx context.Context, limit, offset int) ([]*models.Account, error) {
	if limit <= 0 || limit > 100 {
		limit = 20 // Default limit
	}

	accounts, err := s.accountRepo.List(ctx, limit, offset)
	if err != nil {
		logrus.WithError(err).Error("Failed to list accounts")
		return nil, fmt.Errorf("failed to list accounts: %w", err)
	}

	return accounts, nil
}

// isValidCurrency validates currency code (basic validation)
func isValidCurrency(currency string) bool {
	validCurrencies := map[string]bool{
		"USD": true,
		"EUR": true,
		"GBP": true,
		"JPY": true,
		"CAD": true,
		"AUD": true,
		"CHF": true,
		"CNY": true,
		"INR": true,
	}
	return validCurrencies[currency]
}
