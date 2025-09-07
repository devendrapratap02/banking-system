package repository

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"banking-system/internal/database"
	"banking-system/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AccountRepository defines the interface for account operations
type AccountRepository interface {
	Create(ctx context.Context, account *models.Account) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Account, error)
	GetByNumber(ctx context.Context, number string) (*models.Account, error)
	Update(ctx context.Context, account *models.Account) error
	UpdateBalance(ctx context.Context, id uuid.UUID, newBalance int64) error
	List(ctx context.Context, limit, offset int) ([]*models.Account, error)
}

// accountRepository implements AccountRepository
type accountRepository struct {
	db *database.PostgresDB
}

// NewAccountRepository creates a new account repository
func NewAccountRepository(db *database.PostgresDB) AccountRepository {
	return &accountRepository{
		db: db,
	}
}

// Create creates a new account
func (r *accountRepository) Create(ctx context.Context, account *models.Account) error {
	// Generate unique account number
	account.Number = r.generateAccountNumber()
	
	// Ensure uniqueness
	for {
		existing, err := r.GetByNumber(ctx, account.Number)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("failed to check account number uniqueness: %w", err)
		}
		if existing == nil {
			break
		}
		account.Number = r.generateAccountNumber()
	}

	if err := r.db.WithContext(ctx).Create(account).Error; err != nil {
		return fmt.Errorf("failed to create account: %w", err)
	}

	return nil
}

// GetByID retrieves an account by ID
func (r *accountRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Account, error) {
	var account models.Account
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get account by ID: %w", err)
	}
	return &account, nil
}

// GetByNumber retrieves an account by account number
func (r *accountRepository) GetByNumber(ctx context.Context, number string) (*models.Account, error) {
	var account models.Account
	if err := r.db.WithContext(ctx).Where("account_number = ?", number).First(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get account by number: %w", err)
	}
	return &account, nil
}

// Update updates an account
func (r *accountRepository) Update(ctx context.Context, account *models.Account) error {
	if err := r.db.WithContext(ctx).Save(account).Error; err != nil {
		return fmt.Errorf("failed to update account: %w", err)
	}
	return nil
}

// UpdateBalance updates an account balance atomically
func (r *accountRepository) UpdateBalance(ctx context.Context, id uuid.UUID, newBalance int64) error {
	result := r.db.WithContext(ctx).Model(&models.Account{}).
		Where("id = ?", id).
		Update("balance", newBalance)
	
	if result.Error != nil {
		return fmt.Errorf("failed to update account balance: %w", result.Error)
	}
	
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	
	return nil
}

// List retrieves accounts with pagination
func (r *accountRepository) List(ctx context.Context, limit, offset int) ([]*models.Account, error) {
	var accounts []*models.Account
	if err := r.db.WithContext(ctx).
		Limit(limit).
		Offset(offset).
		Find(&accounts).Error; err != nil {
		return nil, fmt.Errorf("failed to list accounts: %w", err)
	}
	return accounts, nil
}

// generateAccountNumber generates a unique account number
func (r *accountRepository) generateAccountNumber() string {
	// Generate a 10-digit account number
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%010d", rand.Intn(10000000000))
}