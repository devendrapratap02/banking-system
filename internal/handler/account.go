package handler

import (
	"net/http"
	"strconv"

	"banking-system/internal/models"
	"banking-system/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

// AccountHandler handles account-related HTTP requests
type AccountHandler struct {
	accountService service.AccountService
}

// NewAccountHandler creates a new account handler
func NewAccountHandler(accountService service.AccountService) *AccountHandler {
	return &AccountHandler{
		accountService: accountService,
	}
}

// CreateAccount handles POST /accounts
func (h *AccountHandler) CreateAccount(c *gin.Context) {
	var req models.CreateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.WithError(err).Error("Invalid request payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account, err := h.accountService.CreateAccount(c.Request.Context(), &req)
	if err != nil {
		logrus.WithError(err).Error("Failed to create account")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account"})
		return
	}

	c.JSON(http.StatusCreated, account.ToResponse())
}

// GetAccount handles GET /accounts/:id
func (h *AccountHandler) GetAccount(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	account, err := h.accountService.GetAccount(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "account not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
			return
		}
		logrus.WithError(err).Error("Failed to get account")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get account"})
		return
	}

	c.JSON(http.StatusOK, account.ToResponse())
}

// GetAccountByNumber handles GET /accounts/number/:number
func (h *AccountHandler) GetAccountByNumber(c *gin.Context) {
	number := c.Param("number")
	if number == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Account number is required"})
		return
	}

	account, err := h.accountService.GetAccountByNumber(c.Request.Context(), number)
	if err != nil {
		if err.Error() == "account not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
			return
		}
		logrus.WithError(err).Error("Failed to get account by number")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get account"})
		return
	}

	c.JSON(http.StatusOK, account.ToResponse())
}

// ListAccounts handles GET /accounts
func (h *AccountHandler) ListAccounts(c *gin.Context) {
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

	accounts, err := h.accountService.ListAccounts(c.Request.Context(), limit, offset)
	if err != nil {
		logrus.WithError(err).Error("Failed to list accounts")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list accounts"})
		return
	}

	// Convert to response format
	responses := make([]*models.AccountResponse, len(accounts))
	for i, account := range accounts {
		responses[i] = account.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"accounts": responses,
		"limit":    limit,
		"offset":   offset,
		"count":    len(responses),
	})
}