import React, { useState, useEffect } from 'react';
import { bankingAPI } from '../services/api';
import { formatCurrency, formatDate } from '../services/utils';

function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalAccounts: 0,
    balancesByCurrency: {},
    recentTransactionsCount: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch accounts
      const accountsResponse = await bankingAPI.getAccounts(10, 0);
      const accountsData = accountsResponse.data.accounts || [];
      setAccounts(accountsData);

      // Calculate balances by currency
      const balancesByCurrency = accountsData.reduce((acc, account) => {
        const currency = account.currency;
        if (!acc[currency]) {
          acc[currency] = 0;
        }
        acc[currency] += account.balance;
        return acc;
      }, {});

      // Fetch recent transactions from all accounts
      let allTransactions = [];
      try {
        const transactionsResponse = await bankingAPI.getTransactions({ limit: 10, offset: 0 });
        allTransactions = transactionsResponse.data.transactions || [];
      } catch (err) {
        console.log('No recent transactions found:', err);
      }

      // Sort by date and take most recent
      allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentTransactions(allTransactions.slice(0, 5));

      setStats({
        totalAccounts: accountsData.length,
        balancesByCurrency,
        recentTransactionsCount: allTransactions.length,
      });

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
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
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalAccounts}</div>
            <div style={{ opacity: 0.9 }}>Total Accounts</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {Object.entries(stats.balancesByCurrency).length > 0 ? (
                Object.entries(stats.balancesByCurrency).map(([currency, balance]) => (
                  <div key={currency} style={{ marginBottom: '0.25rem' }}>
                    {formatCurrency(balance, currency)}
                  </div>
                ))
              ) : (
                formatCurrency(0)
              )}
            </div>
            <div style={{ opacity: 0.9 }}>Total Balances</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.recentTransactionsCount}</div>
            <div style={{ opacity: 0.9 }}>Recent Transactions</div>
          </div>
        </div>
      </div>

      {/* Recent Accounts */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>🏦 Recent Accounts</h3>
        {accounts.length > 0 ? (
          <div className="grid">
            {accounts.slice(0, 3).map((account) => (
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
        {recentTransactions.length > 0 ? (
          <div>
            {recentTransactions.map((transaction) => (
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
}

export default Dashboard;