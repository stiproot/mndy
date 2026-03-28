/**
 * Date utilities for brand insights test scripts
 */

/**
 * Format Date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get date range for last N days
 * Returns dates in YYYY-MM-DD format
 */
export function getLastNDaysRange(days: number): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/**
 * Get last 7 days (default for tests)
 */
export function getLast7Days() {
  return getLastNDaysRange(7);
}
