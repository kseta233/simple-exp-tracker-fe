export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatIdrDigitsInput(value: string): string {
  const digits = value.replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0
  }).format(Number(digits));
}
