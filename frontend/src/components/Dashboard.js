import React, { useState, useEffect } from 'react';
import { bankingAPI } from '../services/api';
import { formatCurrency, formatDate } from '../services/utils';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_accounts: 0,
    recent_accounts: [],
    recent_transactions: [],
    balances_by_currency: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-rotation timer effect
  useEffect(() => {
    if (!autoRotate) return;
    
    const currencyEntries = Object.entries(stats.balances_by_currency || {});
    if (currencyEntries.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentCurrencyIndex((prev) => (prev + 1) % currencyEntries.length);
    }, 3000); // Change currency every 3 seconds

    return () => clearInterval(timer);
  }, [autoRotate, stats.balances_by_currency]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all dashboard data from single API call
      const dashboardResponse = await bankingAPI.getDashboard();
      const dashboardData = dashboardResponse.data;

      setStats(dashboardData.stats);

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get currencies and current currency for rotation
  const currencyEntries = Object.entries(stats.balances_by_currency || {});
  const currentCurrency = currencyEntries[currentCurrencyIndex];

  const nextCurrency = () => {
    setAutoRotate(false); // Stop auto-rotation when user manually navigates
    setCurrentCurrencyIndex((prev) => (prev + 1) % currencyEntries.length);
  };

  const prevCurrency = () => {
    setAutoRotate(false); // Stop auto-rotation when user manually navigates
    setCurrentCurrencyIndex((prev) => (prev - 1 + currencyEntries.length) % currencyEntries.length);
  };

  const toggleAutoRotate = () => {
    setAutoRotate(prev => !prev);
  };

  if (loading) {
    return (
      <div className="loading">
        <div>📊 Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>📊 Dashboard Overview</h2>
        
        {error && <div className="error">{error}</div>}
        
        {/* Stats Cards */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏦</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_accounts}</div>
            <div style={{ opacity: 0.9 }}>Total Accounts</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            textAlign: 'center',
            position: 'relative',
            minHeight: '120px'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', minHeight: '1.5rem' }}>
              {currencyEntries.length > 0 ? (
                currentCurrency ? (
                  <div>
                    {formatCurrency(currentCurrency[1], currentCurrency[0])}
                  </div>
                ) : (
                  formatCurrency(0)
                )
              ) : (
                formatCurrency(0)
              )}
            </div>
            <div style={{ opacity: 0.9, marginBottom: '0.5rem' }}>
              {currencyEntries.length > 1 ? `Balance (${currentCurrencyIndex + 1}/${currencyEntries.length})` : 'Total Balance'}
            </div>
            
            {/* Currency Navigation Buttons */}
            {currencyEntries.length > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                <button 
                  onClick={prevCurrency}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}
                >
                  ←
                </button>
                <button 
                  onClick={nextCurrency}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}
                >
                  →
                </button>
                <button 
                  onClick={toggleAutoRotate}
                  style={{
                    background: autoRotate ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    marginLeft: '0.25rem'
                  }}
                  title={autoRotate ? 'Disable auto-rotation' : 'Enable auto-rotation'}
                >
                  {autoRotate ? '⏸' : '▶'}
                </button>
              </div>
            )}
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.recent_transactions_count || 0}</div>
            <div style={{ opacity: 0.9 }}>Recent Transactions</div>
          </div>
        </div>
      </div>

      {/* Recent Accounts */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>🏦 Recent Accounts</h3>
        {stats.recent_accounts && stats.recent_accounts.length > 0 ? (
          <div className="grid">
            {stats.recent_accounts.slice(0, 3).map((account) => (
              <div key={account.id} className="account-card">
                <div className="account-number">Account: {account.account_number}</div>
                <div className="account-name">{account.name}</div>
                <div className="account-balance">{formatCurrency(account.balance, account.currency)}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '0.5rem' }}>
                  {account.currency} • {account.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No accounts found. <a href="/create-account" style={{ color: '#667eea' }}>Create your first account</a>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>📋 Recent Transactions</h3>
        {stats.recent_transactions && stats.recent_transactions.length > 0 ? (
          <div>
            {stats.recent_transactions.map((transaction) => (
              <div key={transaction.transaction_id} className="transaction-item">
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {transaction.description || `${transaction.type} transaction`}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {formatDate(transaction.created_at)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={`transaction-amount ${transaction.type === 'deposit' ? 'positive' : 'negative'}`}>
                    {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                  </div>
                  <div className={`transaction-type ${transaction.type}`}>
                    {transaction.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No recent transactions found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;