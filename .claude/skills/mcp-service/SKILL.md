---
name: mcp-service
description: Generate an Effect.Service for MCP servers with resilience patterns
---

# MCP Service Generator

Generates an Effect.Service for MCP servers with production-ready patterns: timeouts, retries, logging, and observability.

## What This Generates

A service file in `src/services/` containing:
1. Effect.Service with dependencies
2. Client initialization (not module-level)
3. Methods with timeout + retry + observability
4. Proper error handling and logging

## Usage

```bash
claude @mcp-service "Create AnalyticsService with methods: trackEvent(event), getReport(startDate, endDate)"
```

## Template

```typescript
// src/services/$SERVICE_FILE.ts
import { Effect, Schedule } from "effect";
import { createLogger } from "mcp-core";
import { $CONFIG_NAME } from "../types.js";
import { $ERROR_TYPES } from "../types.js";

const logger = createLogger("$LOGGER_NAME");

export class $SERVICE_NAME extends Effect.Service<$SERVICE_NAME>()("$SERVICE_NAME", {
  effect: Effect.gen(function* () {
    const config = yield* $CONFIG_NAME;
    $DEPENDENCIES

    // Client initialization (not module-level!)
    const client = new $CLIENT_CLASS($CLIENT_ARGS);

    return {
      $METHODS
    };
  }),
  dependencies: [$DEPENDENCY_LIST],
}) {}
```

## Method Template

```typescript
methodName: (arg1: Type1, arg2: Type2) =>
  Effect.gen(function* () {
    logger.debug("$METHOD_NAME called", { arg1, arg2 });

    const result = yield* Effect.tryPromise({
      try: () => client.operation(arg1, arg2),
      catch: (error) => $ERROR_MAPPER(error),
    }).pipe(
      Effect.timeoutFail({
        duration: "$TIMEOUT seconds",
        onTimeout: () => new TimeoutError({
          operation: "$METHOD_NAME",
          duration: $TIMEOUT,
        }),
      }),
      Effect.retry({
        schedule: Schedule.exponential("1 second").pipe(
          Schedule.jittered,
          Schedule.intersect(Schedule.recurs(3))
        ),
      }),
      Effect.withSpan("$METHOD_NAME", {
        attributes: { arg1, arg2 }
      })
    );

    logger.info("$METHOD_NAME completed", { result });
    return result;
  }).$OPTIONAL_ERROR_CATCH,
```

## Placeholders

- `$SERVICE_FILE` - Kebab-case file name (e.g., "analytics.service")
- `$SERVICE_NAME` - PascalCase class name (e.g., "AnalyticsService")
- `$CONFIG_NAME` - PascalCase config name (e.g., "AnalyticsConfig")
- `$LOGGER_NAME` - Kebab-case logger name (e.g., "analytics-service")
- `$CLIENT_CLASS` - Third-party client class (e.g., "AnalyticsClient")
- `$CLIENT_ARGS` - Constructor arguments (e.g., "config.apiKey, config.endpoint")
- `$DEPENDENCIES` - Yielded dependency services
- `$DEPENDENCY_LIST` - Array of dependencies (e.g., "[AnalyticsConfig.Default, OtherService.Default]")
- `$METHODS` - Service methods
- `$METHOD_NAME` - camelCase method name
- `$TIMEOUT` - Timeout duration in seconds
- `$ERROR_MAPPER` - Function to map errors
- `$ERROR_TYPES` - Imported error classes
- `$OPTIONAL_ERROR_CATCH` - Optional `.pipe(Effect.catchTag(...))`

## Error Mapping Template

For simple mapping:
```typescript
catch: (error) => new MyApiError({ cause: error })
```

For conditional mapping (with type guard):
```typescript
catch: (error) => {
  if (isQuotaError(error)) {
    return new MyQuotaError({
      message: error.message,
      retryAfter: error.retryAfter,
    });
  }
  if (isRateLimitError(error)) {
    return new MyRateLimitError({
      message: error.message,
    });
  }
  return new MyApiError({ cause: error });
}
```

## Example

**Input:**
```
Create StripeService with:
- createPayment(amount, currency, customerId): Creates a payment intent
- getInvoices(customerId, limit): Fetches customer invoices
- cancelSubscription(subscriptionId): Cancels a subscription

Config: StripeConfig with apiKey and webhookSecret
Dependencies: None
```

**Output:**
```typescript
// src/services/stripe.service.ts
import { Effect, Schedule } from "effect";
import { createLogger } from "mcp-core";
import Stripe from "stripe";
import {
  StripeConfig,
  StripeApiError,
  StripeRateLimitError,
  TimeoutError,
} from "../types.js";

const logger = createLogger("stripe-service");

// Type guard for Stripe rate limit errors
function isRateLimitError(error: unknown): error is Stripe.errors.StripeRateLimitError {
  return error instanceof Error && error.constructor.name === "StripeRateLimitError";
}

export class StripeService extends Effect.Service<StripeService>()("StripeService", {
  effect: Effect.gen(function* () {
    const config = yield* StripeConfig;

    // Client initialization
    const client = new Stripe(config.apiKey, {
      apiVersion: "2024-11-20.acacia",
    });

    return {
      createPayment: (amount: number, currency: string, customerId: string) =>
        Effect.gen(function* () {
          logger.debug("Creating payment", { amount, currency, customerId });

          const result = yield* Effect.tryPromise({
            try: () =>
              client.paymentIntents.create({
                amount,
                currency,
                customer: customerId,
              }),
            catch: (error) => {
              if (isRateLimitError(error)) {
                return new StripeRateLimitError({
                  message: "Rate limit exceeded",
                });
              }
              return new StripeApiError({ cause: error });
            },
          }).pipe(
            Effect.timeoutFail({
              duration: "30 seconds",
              onTimeout: () =>
                new TimeoutError({
                  operation: "createPayment",
                  duration: 30,
                }),
            }),
            Effect.retry({
              schedule: Schedule.exponential("1 second").pipe(
                Schedule.jittered,
                Schedule.intersect(Schedule.recurs(3))
              ),
            }),
            Effect.withSpan("createPayment", {
              attributes: { amount, currency, customerId },
            })
          );

          logger.info("Payment created", { paymentId: result.id });
          return result;
        }),

      getInvoices: (customerId: string, limit: number = 10) =>
        Effect.gen(function* () {
          logger.debug("Fetching invoices", { customerId, limit });

          const result = yield* Effect.tryPromise({
            try: () =>
              client.invoices.list({
                customer: customerId,
                limit,
              }),
            catch: (error) => {
              if (isRateLimitError(error)) {
                return new StripeRateLimitError({
                  message: "Rate limit exceeded",
                });
              }
              return new StripeApiError({ cause: error });
            },
          }).pipe(
            Effect.timeoutFail({
              duration: "30 seconds",
              onTimeout: () =>
                new TimeoutError({
                  operation: "getInvoices",
                  duration: 30,
                }),
            }),
            Effect.retry({
              schedule: Schedule.exponential("1 second").pipe(
                Schedule.jittered,
                Schedule.intersect(Schedule.recurs(3))
              ),
            }),
            Effect.withSpan("getInvoices", {
              attributes: { customerId, limit },
            })
          );

          logger.info("Invoices fetched", { count: result.data.length });
          return result.data;
        }),

      cancelSubscription: (subscriptionId: string) =>
        Effect.gen(function* () {
          logger.debug("Cancelling subscription", { subscriptionId });

          const result = yield* Effect.tryPromise({
            try: () => client.subscriptions.cancel(subscriptionId),
            catch: (error) => {
              if (isRateLimitError(error)) {
                return new StripeRateLimitError({
                  message: "Rate limit exceeded",
                });
              }
              return new StripeApiError({ cause: error });
            },
          }).pipe(
            Effect.timeoutFail({
              duration: "30 seconds",
              onTimeout: () =>
                new TimeoutError({
                  operation: "cancelSubscription",
                  duration: 30,
                }),
            }),
            Effect.retry({
              schedule: Schedule.exponential("1 second").pipe(
                Schedule.jittered,
                Schedule.intersect(Schedule.recurs(3))
              ),
            }),
            Effect.withSpan("cancelSubscription", {
              attributes: { subscriptionId },
            })
          );

          logger.info("Subscription cancelled", { subscriptionId });
          return result;
        }),
    };
  }),
  dependencies: [StripeConfig.Default],
}) {}
```

## Guidelines

### Client Initialization
- ❌ **Never** initialize clients at module level
- ✅ **Always** initialize inside the Effect.gen
- ✅ Use config yielded from dependencies

### Resilience
- ✅ **Always** wrap external calls with timeout (default: 30-60s)
- ✅ **Always** retry with exponential backoff + jitter
- ✅ **Always** limit retries (typically 3 attempts)
- ✅ Only retry transient errors (429, 5xx), not 4xx

### Observability
- ✅ **Always** use `Effect.withSpan` with attributes
- ✅ Log at debug (entry), info (success), error (failure)
- ✅ Include relevant context in log objects

### Error Handling
- ✅ Define type guards for third-party error detection
- ✅ Map to tagged errors (never throw)
- ✅ Include contextual information (status codes, retry timing)
- ✅ Catch specific error tags in tools, not in services

### Dependencies
- ✅ List all dependencies in the `dependencies` array
- ✅ Yield dependencies in the effect
- ✅ Config objects are dependencies too

## Type Guard Pattern

For third-party libraries with specific error types:

```typescript
// Stripe
function isRateLimitError(error: unknown): error is Stripe.errors.StripeRateLimitError {
  return error instanceof Error && error.constructor.name === "StripeRateLimitError";
}

// Google APIs
function isQuotaError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 429
  );
}

// Octokit (GitHub)
function isRateLimitError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 429
  );
}
```

## After Creating Service

1. Export from `src/types.ts` if not using separate file
2. Provide in `src/index.ts`:
```typescript
Effect.provide(MyService.Default)
```
3. Use in tools via dependency injection:
```typescript
const service = yield* MyService;
```

## Related

- See `.claude/rules/mcp-server.md` for patterns
- See `@effect-service` for basic Effect.Service
- See `@mcp-tool` for using services in tools
- See `@mcp-errors` for error definitions
