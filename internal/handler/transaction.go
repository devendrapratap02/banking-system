package handler

import (
	"net/http"
	"strconv"

	"banking-system/internal/models"
	"banking-system/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TransactionHandler handles transaction-related HTTP requests
type TransactionHandler struct {
	transactionService service.TransactionService
}

// NewTransactionHandler creates a new transaction handler
func NewTransactionHandler(transactionService service.TransactionService) *TransactionHandler {
	return &TransactionHandler{
		transactionService: transactionService,
	}
}

// CreateTransaction handles POST /transactions
func (h *TransactionHandler) CreateTransaction(c *gin.Context) {
	var req models.TransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Error("Invalid request payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transaction, err := h.transactionService.CreateTransaction(c.Request.Context(), &req)
	if err != nil {
		logrus.WithError(err).Error("Failed to create transaction")

		// Handle specific error cases
		switch err.Error() {
		case "account not found":
			c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		case "account is not active":
			c.JSON(http.StatusBadRequest, gin.H{"error": "Account is not active"})
		case "insufficient balance":
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		default:
			if len(err.Error()) > 17 && err.Error()[:17] == "currency mismatch" {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
			}
		}
		return
	}

	c.JSON(http.StatusCreated, transaction.ToResponse())
}

// GetTransaction handles GET /transactions/:id
func (h *TransactionHandler) GetTransaction(c *gin.Context) {
	idStr := c.Param("id")

	// Try to parse as transaction ID (UUID) first
	if transactionID, err := uuid.Parse(idStr); err == nil {
		transaction, err := h.transactionService.GetTransactionByID(c.Request.Context(), transactionID)
		if err != nil {
			if err.Error() == "transaction not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
				return
			}
			logrus.WithError(err).Error("Failed to get transaction by ID")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transaction"})
			return
		}
		c.JSON(http.StatusOK, transaction.ToResponse())
		return
	}

	// Try to parse as MongoDB ObjectID
	objectID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	transaction, err := h.transactionService.GetTransaction(c.Request.Context(), objectID)
	if err != nil {
		if err.Error() == "transaction not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
			return
		}
		logrus.WithError(err).Error("Failed to get transaction")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transaction"})
		return
	}

	c.JSON(http.StatusOK, transaction.ToResponse())
}

// GetTransactions handles GET /transactions with optional filters
func (h *TransactionHandler) GetTransactions(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// Build filters from query parameters
	filters := make(map[string]interface{})

	if accountID := c.Query("account_id"); accountID != "" {
		filters["account_id"] = accountID
	}

	if transactionType := c.Query("type"); transactionType != "" {
		filters["type"] = transactionType
	}

	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}

	if currency := c.Query("currency"); currency != "" {
		filters["currency"] = currency
	}

	transactions, total, err := h.transactionService.GetTransactions(c.Request.Context(), filters, limit, offset)
	if err != nil {
		logrus.WithError(err).Error("Failed to get transactions")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	// Convert to response format
	responses := make([]*models.TransactionResponse, len(transactions))
	for i, transaction := range transactions {
		responses[i] = transaction.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": responses,
		"limit":        limit,
		"offset":       offset,
		"count":        len(responses),
		"total":        total,
	})
}

// GetTransactionHistory handles GET /accounts/:id/transactions
func (h *TransactionHandler) GetTransactionHistory(c *gin.Context) {
	accountIDStr := c.Param("id")
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	transactions, err := h.transactionService.GetTransactionHistory(c.Request.Context(), accountID, limit, offset)
	if err != nil {
		logrus.WithError(err).Error("Failed to get transaction history")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transaction history"})
		return
	}

	// Convert to response format
	responses := make([]*models.TransactionResponse, len(transactions))
	for i, transaction := range transactions {
		responses[i] = transaction.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": responses,
		"limit":        limit,
		"offset":       offset,
		"count":        len(responses),
	})
}
