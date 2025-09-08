import React, { useState, useEffect } from "react";
import { bankingAPI } from "../services/api";
import { dollarsTocents, formatCurrency } from "../services/utils";

function CreateTransaction() {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    account_id: "",
    type: "deposit",
    amount: "",
    currency: "USD",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdTransaction, setCreatedTransaction] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (formData.account_id) {
      const account = accounts.find((acc) => acc.id === formData.account_id);
      setSelectedAccount(account);
      if (account) {
        setFormData((prev) => ({ ...prev, currency: account.currency }));
      }
    } else {
      setSelectedAccount(null);
    }
  }, [formData.account_id, accounts]);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await bankingAPI.getAccounts(50, 0); // Get more accounts for selection
      setAccounts(response.data.accounts || []);
    } catch (err) {
      setError("Failed to load accounts");
      console.error("Error fetching accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate form data
      if (!formData.account_id) {
        throw new Error("Please select an account");
      }

      if (
        !formData.amount ||
        isNaN(parseFloat(formData.amount)) ||
        parseFloat(formData.amount) <= 0
      ) {
        throw new Error("Please enter a valid amount greater than 0");
      }

      // Check for withdrawal with insufficient balance
      if (formData.type === "withdrawal" && selectedAccount) {
        const amountInCents = dollarsTocents(formData.amount);
        if (amountInCents > selectedAccount.balance) {
          throw new Error(
            `Insufficient balance. Available: ${formatCurrency(selectedAccount.balance, selectedAccount.currency)}`,
          );
        }
      }

      // Prepare data for API
      const transactionData = {
        account_id: formData.account_id,
        type: formData.type,
        amount: dollarsTocents(formData.amount),
        currency: formData.currency,
        description:
          formData.description.trim() || `${formData.type} transaction`,
      };

      const response = await bankingAPI.createTransaction(transactionData);

      setCreatedTransaction(response.data);
      setSuccess(
        "Transaction created successfully! It will be processed shortly.",
      );

      // Reset form
      setFormData({
        account_id: "",
        type: "deposit",
        amount: "",
        currency: "USD",
        description: "",
      });
      setSelectedAccount(null);

      // Refresh accounts to get updated balances
      fetchAccounts();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to create transaction",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingAccounts) {
    return (
      <div className="loading">
        <div>💸 Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: "2rem", color: "#1f2937" }}>
        💸 Create New Transaction
      </h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {createdTransaction && (
        <div className="success" style={{ marginBottom: "2rem" }}>
          <h3>🎉 Transaction Created Successfully!</h3>
          <div style={{ marginTop: "1rem" }}>
            <strong>Transaction ID:</strong> {createdTransaction.transaction_id}
            <br />
            <strong>Type:</strong> {createdTransaction.type}
            <br />
            <strong>Amount:</strong>{" "}
            {formatCurrency(
              createdTransaction.amount,
              createdTransaction.currency,
            )}
            <br />
            <strong>Status:</strong> {createdTransaction.status}
            <br />
            <strong>Description:</strong> {createdTransaction.description}
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏦</div>
          <h3 style={{ color: "#6b7280", marginBottom: "1rem" }}>
            No Accounts Available
          </h3>
          <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>
            You need to create an account before making transactions
          </p>
          <a href="/create-account" className="btn">
            ➕ Create Account
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="account_id">Select Account *</label>
            <select
              id="account_id"
              name="account_id"
              value={formData.account_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Choose an account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - #{account.account_number}(
                  {formatCurrency(account.balance, account.currency)})
                </option>
              ))}
            </select>
          </div>

          {selectedAccount && (
            <div
              style={{
                background: "#f8fafc",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                border: "1px solid #e2e8f0",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#374151" }}>
                Selected Account Details:
              </h4>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                <strong>Name:</strong> {selectedAccount.name}
                <br />
                <strong>Account Number:</strong>{" "}
                {selectedAccount.account_number}
                <br />
                <strong>Current Balance:</strong>{" "}
                {formatCurrency(
                  selectedAccount.balance,
                  selectedAccount.currency,
                )}
                <br />
                <strong>Currency:</strong> {selectedAccount.currency}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="type">Transaction Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="deposit">💰 Deposit</option>
              <option value="withdrawal">💸 Withdrawal</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount ({formData.currency}) *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
            <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              Enter amount in {formData.currency} (e.g., 100.50)
              {selectedAccount && formData.type === "withdrawal" && (
                <span style={{ color: "#ef4444" }}>
                  <br />
                  Available balance:{" "}
                  {formatCurrency(
                    selectedAccount.balance,
                    selectedAccount.currency,
                  )}
                </span>
              )}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter transaction description..."
              maxLength={255}
              rows={3}
            />
            <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              Optional description for this transaction (max 255 characters)
            </small>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "⏳ Processing..." : "💸 Create Transaction"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  account_id: "",
                  type: "deposit",
                  amount: "",
                  currency: "USD",
                  description: "",
                });
                setError("");
                setSuccess("");
                setCreatedTransaction(null);
                setSelectedAccount(null);
              }}
            >
              🔄 Reset Form
            </button>
          </div>
        </form>
      )}

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ color: "#374151", marginBottom: "0.5rem" }}>
          💡 Transaction Notes:
        </h4>
        <ul
          style={{
            color: "#6b7280",
            fontSize: "0.875rem",
            paddingLeft: "1.5rem",
          }}
        >
          <li>
            Transactions are processed asynchronously and may take a few moments
          </li>
          <li>Deposits add money to the account, withdrawals remove money</li>
          <li>Withdrawals cannot exceed the current account balance</li>
          <li>All amounts are processed in the account's currency</li>
          <li>Transaction history is available in the Transactions section</li>
        </ul>
      </div>
    </div>
  );
}

export default CreateTransaction;
