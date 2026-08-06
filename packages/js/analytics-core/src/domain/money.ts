/**
 * Currency and time normalization.
 *
 * Both are places where a silently-wrong answer is easy: summing ZAR and USD into one
 * "revenue" figure, or comparing a Meta day (account timezone) against a Shopify day (UTC)
 * and calling the gap a trend. These helpers make the mismatch explicit instead.
 */

import { Data } from "effect";

/** ISO 4217, e.g. USD, EUR, ZAR. */
export type CurrencyCode = string;

export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export class CurrencyMismatchError extends Data.TaggedError("CurrencyMismatchError")<{
  readonly found: readonly CurrencyCode[];
}> {
  get message(): string {
    return `Cannot combine amounts in different currencies: ${this.found.join(", ")}. Convert to a base currency first.`;
  }
}

/**
 * Sum money values, refusing to add across currencies.
 *
 * There is deliberately no built-in conversion: rates are a data-source decision with a
 * date attached, and burying a guess in a sum is how reports end up unreproducible.
 */
export const sumMoney = (values: readonly Money[]): Money | CurrencyMismatchError => {
  if (values.length === 0) return { amount: 0, currency: "" };

  const currencies = [...new Set(values.map((value) => value.currency))];
  if (currencies.length > 1) return new CurrencyMismatchError({ found: currencies });

  return {
    amount: values.reduce((total, value) => total + value.amount, 0),
    currency: currencies[0]!,
  };
};

/** The project's default reporting timezone, overridable per brand. */
export const DEFAULT_TIMEZONE = "Africa/Johannesburg";

/** Format a date as the `YYYY-MM-DD` every platform API expects, in a given timezone. */
export const toReportDate = (date: Date, timezone: string = DEFAULT_TIMEZONE): string => {
  // en-CA yields ISO-ordered parts, so this is a date-only ISO string in the target zone.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};
