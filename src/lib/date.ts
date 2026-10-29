/**
 * Utility for formatting timestamps consistently in Philippine Standard Time (Asia/Manila).
 * Ensures that regardless of client device or server timezone settings,
 * dates, times, and day boundaries always accurately reflect Philippine Time (UTC+8).
 */

export const MANILA_TIMEZONE = "Asia/Manila";

export type DateInput = Date | string | number;

/**
 * Coerce input into a valid Date object.
 */
function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

/**
 * Format full date and time in Manila timezone.
 * Example: "Okt 27, 2026, 8:40 PM"
 */
export function formatManilaDateTime(
  input: DateInput,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(input);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(date);
}

/**
 * Format date only in Manila timezone.
 * Example: "Okt 27, 2026"
 */
export function formatManilaDate(
  input: DateInput,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(input);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(date);
}

/**
 * Format time only in Manila timezone.
 * Example: "8:40 PM"
 */
export function formatManilaTime(
  input: DateInput,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(input);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(date);
}

/**
 * Friendly relative Manila date/time for transactions and utang entries.
 * Examples:
 * - "Ngayon, 8:40 PM" (kung ngayong araw)
 * - "Kahapon, 4:15 PM" (kung kahapon)
 * - "Okt 25, 2:10 PM" (kung mas maaga pa)
 */
export function formatManilaRelative(input: DateInput): string {
  const date = toDate(input);
  if (isNaN(date.getTime())) return "—";

  const now = new Date();

  // Format date strings in Manila timezone to compare calendar days
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const targetDateStr = formatter.format(date);
  const todayStr = formatter.format(now);

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = formatter.format(yesterday);

  const timeStr = formatManilaTime(date);

  if (targetDateStr === todayStr) {
    return `Ngayon, ${timeStr}`;
  }

  if (targetDateStr === yesterdayStr) {
    return `Kahapon, ${timeStr}`;
  }

  return `${formatManilaDate(date)}, ${timeStr}`;
}

/**
 * Get the UTC Date objects representing the start (00:00:00.000) and end (23:59:59.999)
 * of "today" in Asia/Manila (UTC+8).
 */
export function getManilaDayBounds(offsetDays: number = 0): { start: Date; end: Date } {
  // Get current date parts in Asia/Manila
  const now = new Date();
  const manilaDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const [yearStr, monthStr, dayStr] = manilaDateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10) + offsetDays;

  // Manila is UTC+8: 00:00:00 Manila is 16:00:00 UTC previous day
  // Using Date.UTC to construct exact UTC timestamps
  const startUtc = new Date(Date.UTC(year, month, day, 0 - 8, 0, 0, 0));
  const endUtc = new Date(Date.UTC(year, month, day, 23 - 8, 59, 59, 999));

  return { start: startUtc, end: endUtc };
}
