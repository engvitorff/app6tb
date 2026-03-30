/**
 * Converts an integer amount of cents into a formatted BRL string.
 * Example: 1542000 -> "R$ 15.420,00"
 */
export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
};

/**
 * Parses a numeric input string (like "150.50" or "150,50") into cents integer.
 * Used when user types into a standard number/text input before setting state.
 */
export const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  // Replace comma with dot if user typed standard BR decimal separator
  const numericValue = parseFloat(value.replace(',', '.'));
  if (isNaN(numericValue)) return 0;
  return Math.round(numericValue * 100);
};
