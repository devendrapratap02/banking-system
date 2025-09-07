export const formatCurrency = (amountInCents, currency = 'USD') => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export const dollarsTocents = (dollars) => {
  return Math.round(parseFloat(dollars) * 100);
};

export const centsToDollars = (cents) => {
  return (cents / 100).toFixed(2);
};

export const getTransactionTypeColor = (type) => {
  switch (type) {
    case 'deposit':
      return '#10b981';
    case 'withdrawal':
      return '#ef4444';
    case 'transfer':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'processed':
      return '#10b981';
    case 'pending':
      return '#f59e0b';
    case 'failed':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};