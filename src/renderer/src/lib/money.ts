/**
 * Currency is rendered as a suffix ("250.50 DZD") rather than a prefix, with a
 * non-breaking space so the amount and symbol never wrap apart.
 */
export function formatMoney(amount: number, symbol: string, options?: { signed?: boolean }): string {
  const sign = options?.signed ? (amount > 0 ? "+" : amount < 0 ? "−" : "") : "";
  const magnitude = Math.abs(amount).toFixed(2);
  return symbol ? `${sign}${magnitude} ${symbol}` : `${sign}${magnitude}`;
}
