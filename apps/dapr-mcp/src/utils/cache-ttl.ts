/**
 * Calculate TTL (time-to-live) in seconds based on the cache key's date range.
 *
 * TTL Strategy:
 * - Today's data: 2 hours (data changes frequently)
 * - Recent data (1-7 days ago): 24 hours
 * - Historical data (>7 days ago): 30 days (effectively permanent for analytics)
 * - Brand reports: No expiration (undefined)
 *
 * @param actorId - Cache key like "ga4-default-2025-03-01-2025-03-07" or "brand-default"
 * @returns TTL in seconds, or undefined for no expiration
 */
export function calculateCacheTTL(actorId: string): number | undefined {
  // Parse date from actorId: source-brandId-startDate-endDate
  const parts = actorId.split('-');

  if (parts.length < 4) {
    // Brand reports don't have date ranges, don't expire
    return undefined;
  }

  // Extract end date (last part)
  const endDate = parts[parts.length - 1]; // e.g., "2025-03-07"
  const today = new Date().toISOString().split('T')[0];

  // Today's data: 2 hours (data changes frequently)
  if (endDate === today) {
    return 2 * 60 * 60; // 2 hours in seconds
  }

  // Calculate days ago
  const daysAgo = Math.floor(
    (Date.now() - new Date(endDate).getTime()) / (24 * 60 * 60 * 1000)
  );

  // Historical data (>7 days): 30 days (effectively permanent for analytics)
  if (daysAgo > 7) {
    return 30 * 24 * 60 * 60; // 30 days in seconds
  }

  // Recent data (1-7 days): 24 hours
  return 24 * 60 * 60; // 24 hours in seconds
}
