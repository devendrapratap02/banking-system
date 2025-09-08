import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CreateAccount from './components/CreateAccount';
import AccountList from './components/AccountList';
import CreateTransaction from './components/CreateTransaction';
import TransactionHistory from './components/TransactionHistory';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Navbar />

          <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 2rem' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<AccountList />} />
              <Route path="/create-account" element={<CreateAccount />} />
              <Route path="/create-transaction" element={<CreateTransaction />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/transactions/:accountId" element={<TransactionHistory />} />
            </Routes>
          </main>

          <footer style={{
            backgroundColor: '#f8fafc',
            color: '#6b7280',
            textAlign: 'center',
            padding: '2rem',
            marginTop: '4rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{ margin: 0 }}>
              🏦 Banking System &copy; 2024 - Secure, Reliable, Fast
            </p>
          </footer>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;