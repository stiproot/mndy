/**
 * Timestamp utility service
 * Formats timestamps for display
 */

export function toLocale(timestamp: string | Date): string {
  if (!timestamp) return '';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString();
}

export function now(): string {
  return new Date().toISOString();
}
