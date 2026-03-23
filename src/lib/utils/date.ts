export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isWithinMonth(dateValue: string, monthKey: string): boolean {
  return dateValue.startsWith(monthKey);
}

export function formatDisplayDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}
