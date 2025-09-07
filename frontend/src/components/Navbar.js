import React from 'react';

function Navbar() {
  const currentPath = window.location.pathname;

  const navItems = [
    { path: '/', label: 'Dashboard', emoji: '📊' },
    { path: '/accounts', label: 'Accounts', emoji: '🏦' },
    { path: '/create-account', label: 'Create Account', emoji: '➕' },
    { path: '/create-transaction', label: 'New Transaction', emoji: '💸' },
    { path: '/transactions', label: 'Transaction History', emoji: '📋' },
  ];

  return (
    <nav style={{
      backgroundColor: '#1f2937',
      padding: '1rem 0',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '2rem' }}>🏦</div>
          <div>
            <h1 style={{
              color: 'white',
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              Banking System
            </h1>
            <div style={{
              color: '#9ca3af',
              fontSize: '0.875rem',
              margin: 0
            }}>
              Secure Financial Management
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          {navItems.map(item => (
            <a
              key={item.path}
              href={item.path}
              style={{
                color: currentPath === item.path ? '#60a5fa' : '#d1d5db',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                backgroundColor: currentPath === item.path ? '#374151' : 'transparent',
                border: currentPath === item.path ? '1px solid #4b5563' : '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (currentPath !== item.path) {
                  e.target.style.backgroundColor = '#374151';
                  e.target.style.color = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPath !== item.path) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#d1d5db';
                }
              }}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>

        {/* System Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#10b981',
          fontSize: '0.875rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}></div>
          <span>System Online</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;