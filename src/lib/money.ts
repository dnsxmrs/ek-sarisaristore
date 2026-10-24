/**
 * Formats a number, string, or Decimal into Philippine Peso currency string (e.g. ₱25.00).
 */
export function formatPeso(amount: number | string | { toString(): string } | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "₱0.00";
  }

  const num = typeof amount === "number" ? amount : parseFloat(amount.toString());
  if (isNaN(num)) {
    return "₱0.00";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Parses user input price into a clean number or returns null if invalid.
 */
export function parsePriceInput(val: string): number | null {
  const cleaned = val.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) {
    return null;
  }
  return Math.round(num * 100) / 100;
}
