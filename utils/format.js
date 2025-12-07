// utils/format.js
export const formatCurrency = (amount, currency = "NGN", locale = "en-NG") => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

// Usage: formatCurrency(50000, "USD", "en-US")