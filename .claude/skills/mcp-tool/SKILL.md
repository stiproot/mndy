---
name: mcp-tool
description: Generate an MCP tool with Effect Schema, Effect function, and registration
---

# MCP Tool Generator

Generates a complete MCP tool file following the dapr-mcp/ga4-mcp/github-issues-mcp patterns.

## What This Generates

A tool file in `src/tools/` containing:
1. Effect Schema with annotations for Claude
2. TypeScript type derived from schema
3. Effect function for business logic
4. Registration function with validation

## Usage

```bash
claude @mcp-tool "Create submit_analytics_data tool for Analytics service with fields: eventName (string), eventData (object)"
```

## Template

```typescript
// src/tools/$TOOL_FILE_NAME.ts
import { Effect, Schema } from "effect";
import { McpServer, createLogger } from "mcp-core";
import type { ToolResult } from "mcp-core";
import { $SERVICE_NAME } from "../services/$SERVICE_FILE.js";

const logger = createLogger("$TOOL_SNAKE_CASE");

// Schema
export const $SCHEMA_NAME = Schema.Struct({
  $FIELD_DEFINITIONS
});

// Type
export type $TYPE_NAME = Schema.Schema.Type<typeof $SCHEMA_NAME>;

// Effect
const $EFFECT_NAME = (input: $TYPE_NAME) =>
  Effect.gen(function* () {
    const service = yield* $SERVICE_NAME;

    logger.debug("$LOG_MESSAGE", { input });

    $BUSINESS_LOGIC

    logger.info("$SUCCESS_MESSAGE", { result });

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
      structuredContent: result,
    };
  }).pipe(
    Effect.catchTag("$ERROR_TYPE", (error) =>
      Effect.succeed({
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true as const,
      })
    )
  );

// Registration
export function $REGISTER_FUNCTION_NAME(server: McpServer): void {
  server.registerTool(
    "$TOOL_SNAKE_CASE",
    {
      title: "$TOOL_TITLE",
      description: "$TOOL_DESCRIPTION",
      inputSchema: $SCHEMA_NAME,
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          // Decode and validate input
          const input = yield* Schema.decodeUnknown($SCHEMA_NAME)(args);
          return yield* $EFFECT_NAME(input);
        }).pipe(Effect.provide($SERVICE_NAME.Default))
      )
  );
}
```

## Placeholders

- `$TOOL_FILE_NAME` - Kebab-case file name (e.g., "submit-analytics-data")
- `$TOOL_SNAKE_CASE` - Snake case tool name (e.g., "submit_analytics_data")
- `$SCHEMA_NAME` - PascalCase schema name (e.g., "SubmitAnalyticsDataInputSchema")
- `$TYPE_NAME` - PascalCase type name (e.g., "SubmitAnalyticsDataInput")
- `$EFFECT_NAME` - camelCase effect function name (e.g., "submitAnalyticsDataEffect")
- `$REGISTER_FUNCTION_NAME` - camelCase registration function (e.g., "registerSubmitAnalyticsDataTool")
- `$SERVICE_NAME` - PascalCase service class name (e.g., "AnalyticsService")
- `$SERVICE_FILE` - Kebab-case service file (e.g., "analytics.service")
- `$TOOL_TITLE` - Human-readable title (e.g., "Submit Analytics Data")
- `$TOOL_DESCRIPTION` - Detailed description for Claude
- `$LOG_MESSAGE` - Debug log message (e.g., "Submitting analytics data")
- `$SUCCESS_MESSAGE` - Info log message (e.g., "Analytics data submitted")
- `$ERROR_TYPE` - Error tag to catch (e.g., "AnalyticsError")
- `$FIELD_DEFINITIONS` - Schema fields with annotations
- `$BUSINESS_LOGIC` - Effect code calling service methods

## Field Definition Template

```typescript
fieldName: Schema.String.annotations({
  description: "Field description for Claude"
}),
```

For optional fields:
```typescript
fieldName: Schema.optional(Schema.Number).annotations({
  description: "Optional field description"
}),
```

For nested objects:
```typescript
fieldName: Schema.Struct({
  nestedField: Schema.String.annotations({ description: "..." }),
}).annotations({
  description: "Object description"
}),
```

For arrays:
```typescript
fieldName: Schema.Array(Schema.String).annotations({
  description: "Array description"
}),
```

## Example

**Input:**
```
Create submit_payment_data tool for PaymentService with:
- amount (number, required): Payment amount in cents
- currency (string, required): ISO currency code
- customerId (string, required): Customer identifier
- metadata (optional object): Additional payment metadata
```

**Output:**
```typescript
// src/tools/submit-payment-data.ts
import { Effect, Schema } from "effect";
import { McpServer, createLogger } from "mcp-core";
import type { ToolResult } from "mcp-core";
import { PaymentService } from "../services/payment.service.js";

const logger = createLogger("submit-payment-data");

// Schema
export const SubmitPaymentDataInputSchema = Schema.Struct({
  amount: Schema.Number.annotations({
    description: "Payment amount in cents"
  }),
  currency: Schema.String.annotations({
    description: "ISO currency code (e.g., USD, EUR, ZAR)"
  }),
  customerId: Schema.String.annotations({
    description: "Customer identifier"
  }),
  metadata: Schema.optional(
    Schema.Record(Schema.String, Schema.Unknown)
  ).annotations({
    description: "Additional payment metadata"
  }),
});

// Type
export type SubmitPaymentDataInput = Schema.Schema.Type<typeof SubmitPaymentDataInputSchema>;

// Effect
const submitPaymentDataEffect = (input: SubmitPaymentDataInput) =>
  Effect.gen(function* () {
    const service = yield* PaymentService;

    logger.debug("Submitting payment data", { customerId: input.customerId, amount: input.amount });

    const result = yield* service.createPayment({
      amount: input.amount,
      currency: input.currency,
      customerId: input.customerId,
      metadata: input.metadata,
    });

    logger.info("Payment data submitted", { paymentId: result.id });

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
      structuredContent: result,
    };
  }).pipe(
    Effect.catchTag("PaymentError", (error) =>
      Effect.succeed({
        content: [{ type: "text" as const, text: `Payment error: ${error.message}` }],
        isError: true as const,
      })
    )
  );

// Registration
export function registerSubmitPaymentDataTool(server: McpServer): void {
  server.registerTool(
    "submit_payment_data",
    {
      title: "Submit Payment Data",
      description: "Creates a payment with the specified amount, currency, and customer",
      inputSchema: SubmitPaymentDataInputSchema,
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          // Decode and validate input
          const input = yield* Schema.decodeUnknown(SubmitPaymentDataInputSchema)(args);
          return yield* submitPaymentDataEffect(input);
        }).pipe(Effect.provide(PaymentService.Default))
      )
  );
}
```

## After Creating Tool

1. Add export to `src/tools/index.ts`:
```typescript
export * from "./submit-payment-data.js";
```

2. Add registration call:
```typescript
import { registerSubmitPaymentDataTool } from "./submit-payment-data.js";

export function registerTools(server: McpServer): void {
  registerSubmitPaymentDataTool(server);
  // ... other tools
}
```

## Guidelines

- Use snake_case for tool names (matches MCP convention)
- Include detailed annotations - Claude reads these!
- Always catch specific error types (never generic catch-all)
- Log at entry and success (debug/info levels)
- Return ToolResult with content array
- Set `isError: true` for error responses
- Use `Effect.provide` for service dependencies
- Validate input with `Schema.decodeUnknown`

## Related

- See `.claude/rules/mcp-server.md` for patterns
- See `@mcp-service` for creating services
- See `@mcp-schema` for complex schemas
- See `@mcp-errors` for error definitions
