package handler

import (
	"net/http"

	"banking-system/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// DashboardHandler handles dashboard-related HTTP requests
type DashboardHandler struct {
	accountService     service.AccountService
	transactionService service.TransactionService
}

// NewDashboardHandler creates a new dashboard handler
func NewDashboardHandler(accountService service.AccountService, transactionService service.TransactionService) *DashboardHandler {
	return &DashboardHandler{
		accountService:     accountService,
		transactionService: transactionService,
	}
}

// DashboardStats represents the dashboard statistics
type DashboardStats struct {
	TotalAccounts           int                    `json:"total_accounts"`
	BalancesByCurrency      map[string]int64       `json:"balances_by_currency"`
	RecentTransactionsCount int64                  `json:"recent_transactions_count"`
}

// DashboardResponse represents the complete dashboard data
type DashboardResponse struct {
	Stats              DashboardStats                    `json:"stats"`
	RecentAccounts     []map[string]interface{}          `json:"recent_accounts"`
	RecentTransactions []map[string]interface{}          `json:"recent_transactions"`
}

// GetDashboard handles GET /dashboard
func (h *DashboardHandler) GetDashboard(c *gin.Context) {
	// Get dashboard statistics
	stats, err := h.getDashboardStats(c)
	if err != nil {
		logrus.WithError(err).Error("Failed to get dashboard stats")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load dashboard data"})
		return
	}

	// Get recent accounts (top 3)
	accounts, err := h.accountService.ListAccounts(c.Request.Context(), 3, 0)
	if err != nil {
		logrus.WithError(err).Error("Failed to get recent accounts")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load dashboard data"})
		return
	}

	recentAccounts := make([]map[string]interface{}, len(accounts))
	for i, account := range accounts {
		recentAccounts[i] = map[string]interface{}{
			"id":             account.ID,
			"account_number": account.Number,
			"name":           account.Name,
			"balance":        account.Balance,
			"currency":       account.Currency,
			"created_at":     account.CreatedAt,
		}
	}

	// Get recent transactions (top 5)
	transactions, total, err := h.transactionService.GetTransactions(c.Request.Context(), nil, 5, 0)
	if err != nil {
		logrus.WithError(err).Error("Failed to get recent transactions")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load dashboard data"})
		return
	}

	recentTransactions := make([]map[string]interface{}, len(transactions))
	for i, transaction := range transactions {
		recentTransactions[i] = map[string]interface{}{
			"id":             transaction.ID,
			"transaction_id": transaction.TransactionID,
			"account_id":     transaction.AccountID,
			"type":           transaction.Type,
			"amount":         transaction.Amount,
			"currency":       transaction.Currency,
			"description":    transaction.Description,
			"status":         transaction.Status,
			"created_at":     transaction.CreatedAt,
			"processed_at":   transaction.ProcessedAt,
		}
	}

	// Update stats with actual transaction count
	stats.RecentTransactionsCount = total

	response := DashboardResponse{
		Stats:              *stats,
		RecentAccounts:     recentAccounts,
		RecentTransactions: recentTransactions,
	}

	c.JSON(http.StatusOK, response)
}

// getDashboardStats calculates dashboard statistics
func (h *DashboardHandler) getDashboardStats(c *gin.Context) (*DashboardStats, error) {
	// Get total accounts count and balances by currency
	accounts, err := h.accountService.ListAccounts(c.Request.Context(), 1000, 0) // Get all accounts for stats
	if err != nil {
		return nil, err
	}

	// Calculate balances by currency
	balancesByCurrency := make(map[string]int64)
	for _, account := range accounts {
		balancesByCurrency[account.Currency] += account.Balance
	}

	// Get total transactions count (just for the count, not the data)
	_, totalTransactions, err := h.transactionService.GetTransactions(c.Request.Context(), nil, 1, 0)
	if err != nil {
		totalTransactions = 0 // Default to 0 if error
	}

	return &DashboardStats{
		TotalAccounts:           len(accounts),
		BalancesByCurrency:      balancesByCurrency,
		RecentTransactionsCount: totalTransactions,

		}, nil
}