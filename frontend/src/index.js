import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handler for unhandled errors (e.g., from browser extensions)
window.addEventListener('error', (event) => {
  // Log the error but don't let it break the app
  console.warn('Global error caught:', event.error);
  
  // Check if it's from a browser extension or external script
  if (event.filename && (
    event.filename.includes('share-modal') ||
    event.filename.includes('extension') ||
    event.filename.includes('chrome-extension') ||
    event.filename.includes('moz-extension')
  )) {
    console.warn('Error from browser extension ignored:', event.filename);
    event.preventDefault(); // Prevent the error from bubbling up
    return true;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  
  // Check if it's from external scripts and ignore if necessary
  if (event.reason && event.reason.toString().includes('share-modal')) {
    console.warn('Promise rejection from external script ignored');
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);