/**
 * Format a number or string as COP currency (Colombian Pesos).
 *
 * @example
 *   formatCurrency(15000)       // "$ 15.000"
 *   formatCurrency("2500.50")   // "$ 2.501"
 */
export const formatCurrency = (amount: number | string): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
};
