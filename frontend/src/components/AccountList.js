import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bankingAPI } from '../services/api';
import { formatCurrency, formatDate } from '../services/utils';

function AccountList() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    hasMore: true,
  });

  useEffect(() => {
    fetchAccounts();
  }, [pagination.limit, pagination.offset]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await bankingAPI.getAccounts(pagination.limit, pagination.offset);
      const data = response.data;
      
      setAccounts(data.accounts || []);
      setPagination(prev => ({
        ...prev,
        hasMore: (data.accounts || []).length === pagination.limit
      }));

    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  const handlePrevPage = () => {
    setPagination(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit)
    }));
  };

  const refreshAccounts = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchAccounts();
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="loading">
        <div>🏦 Loading accounts...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#1f2937', margin: 0 }}>🏦 Account Management</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={refreshAccounts} className="btn btn-secondary" disabled={loading}>
              🔄 Refresh
            </button>
            <Link to="/create-account" className="btn">
              ➕ New Account
            </Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏦</div>
            <h3 style={{ color: '#6b7280', marginBottom: '1rem' }}>No Accounts Found</h3>
            <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
              Get started by creating your first account
            </p>
            <Link to="/create-account" className="btn">
              ➕ Create First Account
            </Link>
          </div>
        ) : (
          <>
            <div className="grid">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>

            {/* Pagination */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={handlePrevPage} 
                className="btn btn-secondary"
                disabled={pagination.offset === 0 || loading}
              >
                ← Previous
              </button>
              
              <span style={{ color: '#6b7280' }}>
                Showing {pagination.offset + 1} - {pagination.offset + accounts.length} accounts
              </span>
              
              <button 
                onClick={handleNextPage} 
                className="btn btn-secondary"
                disabled={!pagination.hasMore || loading}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AccountCard({ account }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#f59e0b';
      case 'closed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✅';
      case 'suspended': return '⏸️';
      case 'closed': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="account-card" style={{ position: 'relative' }}>
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        right: '1rem',
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '0.5rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '600'
      }}>
        {getStatusIcon(account.status)} {account.status}
      </div>
      
      <div className="account-number">
        #{account.account_number}
      </div>
      
      <div className="account-name">
        {account.name}
      </div>
      
      <div className="account-balance">
        {formatCurrency(account.balance, account.currency)}
      </div>
      
      <div style={{ 
        fontSize: '0.875rem', 
        opacity: 0.8, 
        marginTop: '1rem',
        marginBottom: '1rem'
      }}>
        Created: {formatDate(account.created_at)}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <Link 
          to={`/transactions/${account.id}`}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          📋 Transactions
        </Link>
        
        <button
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => {
            navigator.clipboard.writeText(account.id);
            // You could add a toast notification here
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          📋 Copy ID
        </button>
      </div>
    </div>
  );
}

export default AccountList;