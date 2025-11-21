const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "$0.00";
  }
  return currencyFormatter.format(amount);
}

export function parseCurrency(value: string | undefined | null): number {
  if (!value) {
    return 0;
  }
  const normalized = value.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

