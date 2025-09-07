import React, { useState, useEffect } from 'react';
import { bankingAPI } from '../services/api';
import { formatCurrency } from '../services/utils';

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    account_id: '',
    type: '',
    status: '',
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    currentPage: 1,
  });

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, [pagination.limit, pagination.offset, filters]);

  const fetchAccounts = async () => {
    try {
      const response = await bankingAPI.getAccounts(100, 0); // Get all accounts for filter
      setAccounts(response.data.accounts || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        ...filters,
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await bankingAPI.getTransactions(params);
      setTransactions(response.data.transactions || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
      }));
    } catch (err) {
      setError('Failed to load transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      offset: 0,
      currentPage: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    const newOffset = (newPage - 1) * pagination.limit;
    setPagination(prev => ({
      ...prev,
      offset: newOffset,
      currentPage: newPage,
    }));
  };

  const clearFilters = () => {
    setFilters({
      account_id: '',
      type: '',
      status: '',
    });
    setPagination(prev => ({
      ...prev,
      offset: 0,
      currentPage: 1,
    }));
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getTypeEmoji = (type) => {
    switch (type) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      default: return '💱';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.name} (${account.account_number})` : 'Unknown Account';
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading && transactions.length === 0) {
    return (
      <div className="loading">
        <div>📊 Loading transaction history...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '2rem', color: '#1f2937' }}>📊 Transaction History</h2>
      
      {error && <div className="error">{error}</div>}

      {/* Filters */}
      <div style={{ 
        background: '#f8fafc', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>🔍 Filter Transactions</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Account
            </label>
            <select
              name="account_id"
              value={filters.account_id}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.account_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Type
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Types</option>
              <option value="deposit">💰 Deposit</option>
              <option value="withdrawal">💸 Withdrawal</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Statuses</option>
              <option value="completed">✅ Completed</option>
              <option value="pending">⏳ Pending</option>
              <option value="failed">❌ Failed</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button 
            onClick={clearFilters}
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem' }}
          >
            🔄 Clear Filters
          </button>
        </div>
      </div>

      {/* Transaction Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="stats-card">
          <div className="stats-icon">📈</div>
          <div className="stats-content">
            <div className="stats-number">{pagination.total}</div>
            <div className="stats-label">Total Transactions</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">✅</div>
          <div className="stats-content">
            <div className="stats-number">
              {transactions.filter(t => t.status === 'completed').length}
            </div>
            <div className="stats-label">Completed</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">⏳</div>
          <div className="stats-content">
            <div className="stats-number">
              {transactions.filter(t => t.status === 'pending').length}
            </div>
            <div className="stats-label">Pending</div>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">❌</div>
          <div className="stats-content">
            <div className="stats-number">
              {transactions.filter(t => t.status === 'failed').length}
            </div>
            <div className="stats-label">Failed</div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ color: '#6b7280', marginBottom: '1rem' }}>No Transactions Found</h3>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
            {Object.values(filters).some(f => f) 
              ? 'No transactions match your current filters'
              : 'No transactions have been created yet'
            }
          </p>
          <a href="/create-transaction" className="btn">
            💸 Create Transaction
          </a>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Transaction ID
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Account
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Type
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                    Amount
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Description
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.transaction_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {transaction.transaction_id}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.875rem' }}>
                        {getAccountName(transaction.account_id)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        textTransform: 'capitalize'
                      }}>
                        {getTypeEmoji(transaction.type)} {transaction.type}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      fontWeight: 'bold',
                      color: transaction.type === 'deposit' ? '#10b981' : '#ef4444'
                    }}>
                      {transaction.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        backgroundColor: `${getStatusColor(transaction.status)}20`,
                        color: getStatusColor(transaction.status),
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}>
                        {getStatusEmoji(transaction.status)} {transaction.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', maxWidth: '200px' }}>
                      <div style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {transaction.description || 'No description'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} transactions
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  ← Previous
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn ${pageNum === pagination.currentPage ? '' : 'btn-secondary'}`}
                        style={{ 
                          fontSize: '0.875rem', 
                          padding: '0.5rem 0.75rem',
                          minWidth: '2.5rem'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === totalPages}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {loading && transactions.length > 0 && (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div>⏳ Loading more transactions...</div>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;