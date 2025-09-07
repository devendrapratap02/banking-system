package repository

import (
	"context"
	"fmt"
	"time"

	"banking-system/internal/database"
	"banking-system/internal/models"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const TransactionCollection = "transactions"

// TransactionRepository defines the interface for transaction operations
type TransactionRepository interface {
	Create(ctx context.Context, transaction *models.Transaction) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*models.Transaction, error)
	GetByTransactionID(ctx context.Context, transactionID uuid.UUID) (*models.Transaction, error)
	Update(ctx context.Context, transaction *models.Transaction) error
	GetByAccountID(ctx context.Context, accountID uuid.UUID, limit, offset int) ([]*models.Transaction, error)
	GetByAccountIDAndStatus(ctx context.Context, accountID uuid.UUID, status models.TransactionStatus, limit, offset int) ([]*models.Transaction, error)
}

// transactionRepository implements TransactionRepository
type transactionRepository struct {
	collection *mongo.Collection
}

// NewTransactionRepository creates a new transaction repository
func NewTransactionRepository(db *database.MongoDB) TransactionRepository {
	return &transactionRepository{
		collection: db.GetCollection(TransactionCollection),
	}
}

// Create creates a new transaction
func (r *transactionRepository) Create(ctx context.Context, transaction *models.Transaction) error {
	transaction.CreatedAt = time.Now()
	
	result, err := r.collection.InsertOne(ctx, transaction)
	if err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}
	
	transaction.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

// GetByID retrieves a transaction by MongoDB ObjectID
func (r *transactionRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&transaction)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get transaction by ID: %w", err)
	}
	return &transaction, nil
}

// GetByTransactionID retrieves a transaction by transaction ID
func (r *transactionRepository) GetByTransactionID(ctx context.Context, transactionID uuid.UUID) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.collection.FindOne(ctx, bson.M{"transaction_id": transactionID}).Decode(&transaction)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get transaction by transaction ID: %w", err)
	}
	return &transaction, nil
}

// Update updates a transaction
func (r *transactionRepository) Update(ctx context.Context, transaction *models.Transaction) error {
	filter := bson.M{"_id": transaction.ID}
	update := bson.M{"$set": transaction}
	
	_, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update transaction: %w", err)
	}
	return nil
}

// GetByAccountID retrieves transactions for an account with pagination
func (r *transactionRepository) GetByAccountID(ctx context.Context, accountID uuid.UUID, limit, offset int) ([]*models.Transaction, error) {
	filter := bson.M{"account_id": accountID}
	
	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "created_at", Value: -1}}) // Sort by created_at descending
	findOptions.SetLimit(int64(limit))
	findOptions.SetSkip(int64(offset))
	
	cursor, err := r.collection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions by account ID: %w", err)
	}
	defer cursor.Close(ctx)
	
	var transactions []*models.Transaction
	if err := cursor.All(ctx, &transactions); err != nil {
		return nil, fmt.Errorf("failed to decode transactions: %w", err)
	}
	
	return transactions, nil
}

// GetByAccountIDAndStatus retrieves transactions for an account by status with pagination
func (r *transactionRepository) GetByAccountIDAndStatus(ctx context.Context, accountID uuid.UUID, status models.TransactionStatus, limit, offset int) ([]*models.Transaction, error) {
	filter := bson.M{
		"account_id": accountID,
		"status":     status,
	}
	
	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "created_at", Value: -1}})
	findOptions.SetLimit(int64(limit))
	findOptions.SetSkip(int64(offset))
	
	cursor, err := r.collection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions by account ID and status: %w", err)
	}
	defer cursor.Close(ctx)
	
	var transactions []*models.Transaction
	if err := cursor.All(ctx, &transactions); err != nil {
		return nil, fmt.Errorf("failed to decode transactions: %w", err)
	}
	
	return transactions, nil
}