export const formatCurrency = (rawVal) => {
  if (rawVal === undefined || rawVal === null) return '$0.00';
  if (typeof rawVal === 'number') return `$${rawVal.toFixed(2)}`;
  const cleanStr = String(rawVal).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
};

export const getNumericPrice = (rawVal) => {
  if (rawVal === undefined || rawVal === null) return 0;
  if (typeof rawVal === 'number') return rawVal;
  const cleanStr = String(rawVal).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};
