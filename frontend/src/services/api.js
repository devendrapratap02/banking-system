import axios from "axios";

// Get API URL from environment variable or default to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to ${config.url}`,
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export const bankingAPI = {
  // Health check
  healthCheck: () => api.get("/health"),

  // Dashboard
  getDashboard: () => api.get("/api/v1/dashboard"),

  // Account operations
  createAccount: (accountData) => api.post("/api/v1/accounts", accountData),
  getAccounts: (limit = 20, offset = 0) =>
    api.get(`/api/v1/accounts?limit=${limit}&offset=${offset}`),
  getAccount: (accountId) => api.get(`/api/v1/accounts/${accountId}`),
  getAccountByNumber: (accountNumber) =>
    api.get(`/api/v1/accounts/number/${accountNumber}`),

  // Transaction operations
  createTransaction: (transactionData) =>
    api.post("/api/v1/transactions", transactionData),
  getTransaction: (transactionId) =>
    api.get(`/api/v1/transactions/${transactionId}`),
  getTransactions: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        queryParams.append(key, params[key]);
      }
    });
    return api.get(`/api/v1/transactions?${queryParams.toString()}`);
  },
  getTransactionHistory: (accountId, limit = 20, offset = 0) =>
    api.get(
      `/api/v1/accounts/${accountId}/transactions?limit=${limit}&offset=${offset}`,
    ),
};

export default api;
