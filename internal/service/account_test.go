package service

import (
	"context"
	"testing"

	"banking-system/internal/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAccountRepository is a mock implementation of AccountRepository
type MockAccountRepository struct {
	mock.Mock
}

func (m *MockAccountRepository) Create(ctx context.Context, account *models.Account) error {
	args := m.Called(ctx, account)
	return args.Error(0)
}

func (m *MockAccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Account, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Account), args.Error(1)
}

func (m *MockAccountRepository) GetByNumber(ctx context.Context, number string) (*models.Account, error) {
	args := m.Called(ctx, number)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Account), args.Error(1)
}

func (m *MockAccountRepository) Update(ctx context.Context, account *models.Account) error {
	args := m.Called(ctx, account)
	return args.Error(0)
}

func (m *MockAccountRepository) UpdateBalance(ctx context.Context, id uuid.UUID, newBalance int64) error {
	args := m.Called(ctx, id, newBalance)
	return args.Error(0)
}

func (m *MockAccountRepository) List(ctx context.Context, limit, offset int) ([]*models.Account, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]*models.Account), args.Error(1)
}

func TestAccountService_CreateAccount(t *testing.T) {
	mockRepo := new(MockAccountRepository)
	service := NewAccountService(mockRepo)

	tests := []struct {
		name    string
		request *models.CreateAccountRequest
		setup   func()
		wantErr bool
	}{
		{
			name: "successful account creation",
			request: &models.CreateAccountRequest{
				Name:           "John Doe",
				InitialBalance: 1000,
				Currency:       "USD",
			},
			setup: func() {
				mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.Account")).Return(nil)
			},
			wantErr: false,
		},
		{
			name: "invalid currency",
			request: &models.CreateAccountRequest{
				Name:           "John Doe",
				InitialBalance: 1000,
				Currency:       "INVALID",
			},
			setup:   func() {},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setup()

			account, err := service.CreateAccount(context.Background(), tt.request)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, account)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, account)
				assert.Equal(t, tt.request.Name, account.Name)
				assert.Equal(t, tt.request.InitialBalance, account.Balance)
				assert.Equal(t, tt.request.Currency, account.Currency)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestAccountService_GetAccount(t *testing.T) {
	mockRepo := new(MockAccountRepository)
	service := NewAccountService(mockRepo)

	accountID := uuid.New()
	notFoundID := uuid.New() // Different ID for not found test
	expectedAccount := &models.Account{
		ID:       accountID,
		Name:     "John Doe",
		Balance:  1000,
		Currency: "USD",
	}

	tests := []struct {
		name    string
		id      uuid.UUID
		setup   func()
		want    *models.Account
		wantErr bool
	}{
		{
			name: "successful account retrieval",
			id:   accountID,
			setup: func() {
				mockRepo.On("GetByID", mock.Anything, accountID).Return(expectedAccount, nil)
			},
			want:    expectedAccount,
			wantErr: false,
		},
		{
			name: "account not found",
			id:   notFoundID, // Use different ID
			setup: func() {
				mockRepo.On("GetByID", mock.Anything, notFoundID).Return((*models.Account)(nil), nil)
			},
			want:    nil,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setup()

			account, err := service.GetAccount(context.Background(), tt.id)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, account)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.want, account)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}
