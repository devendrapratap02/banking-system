import React, { useState } from "react";
import { bankingAPI } from "../services/api";
import { dollarsTocents } from "../services/utils";

const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "INR",
];

function CreateAccount() {
  const [formData, setFormData] = useState({
    name: "",
    initial_balance: "",
    currency: "USD",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdAccount, setCreatedAccount] = useState(null);

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
      if (!formData.name.trim()) {
        throw new Error("Account name is required");
      }

      if (
        formData.initial_balance &&
        isNaN(parseFloat(formData.initial_balance))
      ) {
        throw new Error("Initial balance must be a valid number");
      }

      // Prepare data for API
      const accountData = {
        name: formData.name.trim(),
        initial_balance: formData.initial_balance
          ? dollarsTocents(formData.initial_balance)
          : 0,
        currency: formData.currency,
      };

      const response = await bankingAPI.createAccount(accountData);

      setCreatedAccount(response.data);
      setSuccess("Account created successfully!");

      // Reset form
      setFormData({
        name: "",
        initial_balance: "",
        currency: "USD",
      });
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to create account",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: "2rem", color: "#1f2937" }}>
        ➕ Create New Account
      </h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {createdAccount && (
        <div className="success" style={{ marginBottom: "2rem" }}>
          <h3>🎉 Account Created Successfully!</h3>
          <div style={{ marginTop: "1rem" }}>
            <strong>Account Number:</strong> {createdAccount.account_number}
            <br />
            <strong>Account ID:</strong> {createdAccount.id}
            <br />
            <strong>Name:</strong> {createdAccount.name}
            <br />
            <strong>Balance:</strong>{" "}
            {(createdAccount.balance / 100).toFixed(2)}{" "}
            {createdAccount.currency}
            <br />
            <strong>Status:</strong> {createdAccount.status}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Account Holder Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter account holder name"
            required
            maxLength={100}
          />
          <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Minimum 2 characters, maximum 100 characters
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="initial_balance">Initial Balance (Optional)</label>
          <input
            type="number"
            id="initial_balance"
            name="initial_balance"
            value={formData.initial_balance}
            onChange={handleInputChange}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Enter amount in dollars (e.g., 1000.50). Leave empty for $0.00
            initial balance.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="currency">Currency *</label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            required
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Select the currency for this account
          </small>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "⏳ Creating..." : "➕ Create Account"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFormData({ name: "", initial_balance: "", currency: "USD" });
              setError("");
              setSuccess("");
              setCreatedAccount(null);
            }}
          >
            🔄 Reset Form
          </button>
        </div>
      </form>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
        }}
      >
        <h4 style={{ color: "#374151", marginBottom: "0.5rem" }}>💡 Tips:</h4>
        <ul
          style={{
            color: "#6b7280",
            fontSize: "0.875rem",
            paddingLeft: "1.5rem",
          }}
        >
          <li>Account numbers are automatically generated and unique</li>
          <li>Initial balance can be added now or through deposits later</li>
          <li>
            All monetary amounts are stored securely to prevent rounding errors
          </li>
          <li>You can create multiple accounts with different currencies</li>
        </ul>
      </div>
    </div>
  );
}

export default CreateAccount;
