---
name: mcp-schema
description: Generate Effect Schema definitions for MCP tool inputs
---

# MCP Schema Generator

Generates Effect Schema definitions for MCP tool inputs with annotations for Claude.

## What This Generates

Effect Schema definitions in `src/types.ts`:
1. Schema with descriptive annotations
2. TypeScript type derived from schema
3. Support for nested objects, arrays, optional fields

## Usage

```bash
claude @mcp-schema "Create PaymentDataSchema with amount (number), currency (string), metadata (optional object)"
```

## Template

```typescript
// src/types.ts (schemas section)
import { Schema } from "effect";

export const $SCHEMA_NAME = Schema.Struct({
  $FIELD_DEFINITIONS
});

export type $TYPE_NAME = Schema.Schema.Type<typeof $SCHEMA_NAME>;
```

## Placeholders

- `$SCHEMA_NAME` - PascalCase schema name (e.g., "PaymentDataSchema")
- `$TYPE_NAME` - PascalCase type name (e.g., "PaymentData")
- `$FIELD_DEFINITIONS` - Schema field definitions

## Field Type Patterns

### String
```typescript
fieldName: Schema.String.annotations({
  description: "Description for Claude"
}),
```

### Number
```typescript
fieldName: Schema.Number.annotations({
  description: "Description for Claude"
}),
```

### Boolean
```typescript
fieldName: Schema.Boolean.annotations({
  description: "Description for Claude"
}),
```

### Optional Field
```typescript
fieldName: Schema.optional(Schema.String).annotations({
  description: "Optional field description"
}),
```

### Nested Object
```typescript
fieldName: Schema.Struct({
  nestedField1: Schema.String.annotations({ description: "..." }),
  nestedField2: Schema.Number.annotations({ description: "..." }),
}).annotations({
  description: "Object description"
}),
```

### Array of Primitives
```typescript
fieldName: Schema.Array(Schema.String).annotations({
  description: "Array of strings"
}),
```

### Array of Objects
```typescript
fieldName: Schema.Array(
  Schema.Struct({
    field1: Schema.String.annotations({ description: "..." }),
    field2: Schema.Number.annotations({ description: "..." }),
  })
).annotations({
  description: "Array of objects"
}),
```

### Record (Key-Value Map)
```typescript
fieldName: Schema.Record(Schema.String, Schema.Unknown).annotations({
  description: "Key-value metadata"
}),
```

### Union (One Of)
```typescript
fieldName: Schema.Union(
  Schema.Literal("option1"),
  Schema.Literal("option2"),
  Schema.Literal("option3")
).annotations({
  description: "Must be one of: option1, option2, option3"
}),
```

### Literal Value
```typescript
fieldName: Schema.Literal("specific-value").annotations({
  description: "Must be exactly 'specific-value'"
}),
```

### Date String
```typescript
fieldName: Schema.String.annotations({
  description: "ISO 8601 date string (e.g., 2024-01-15)"
}),
```

### Unknown (Any)
```typescript
fieldName: Schema.Unknown.annotations({
  description: "Any value accepted"
}),
```

## Example 1: Simple Schema

**Input:**
```
Create PaymentDataSchema with:
- amount (number): Payment amount in cents
- currency (string): ISO currency code
- description (string, optional): Payment description
```

**Output:**
```typescript
// src/types.ts
import { Schema } from "effect";

export const PaymentDataSchema = Schema.Struct({
  amount: Schema.Number.annotations({
    description: "Payment amount in cents (e.g., 1000 for $10.00)"
  }),
  currency: Schema.String.annotations({
    description: "ISO 4217 currency code (e.g., USD, EUR, ZAR)"
  }),
  description: Schema.optional(Schema.String).annotations({
    description: "Optional payment description"
  }),
});

export type PaymentData = Schema.Schema.Type<typeof PaymentDataSchema>;
```

## Example 2: Nested Schema

**Input:**
```
Create AnalyticsReportSchema with:
- dateRange (object with startDate and endDate strings)
- metrics (array of strings): Metric names to include
- dimensions (array of strings, optional): Dimension names
- filters (optional object): Key-value filter pairs
```

**Output:**
```typescript
// src/types.ts
import { Schema } from "effect";

export const AnalyticsReportSchema = Schema.Struct({
  dateRange: Schema.Struct({
    startDate: Schema.String.annotations({
      description: "Start date in YYYY-MM-DD format"
    }),
    endDate: Schema.String.annotations({
      description: "End date in YYYY-MM-DD format"
    }),
  }).annotations({
    description: "The date range for the report"
  }),
  metrics: Schema.Array(Schema.String).annotations({
    description: "List of metric names to include (e.g., 'sessions', 'conversions', 'revenue')"
  }),
  dimensions: Schema.optional(
    Schema.Array(Schema.String)
  ).annotations({
    description: "Optional list of dimension names (e.g., 'city', 'deviceCategory')"
  }),
  filters: Schema.optional(
    Schema.Record(Schema.String, Schema.String)
  ).annotations({
    description: "Optional key-value pairs for filtering results"
  }),
});

export type AnalyticsReport = Schema.Schema.Type<typeof AnalyticsReportSchema>;
```

## Example 3: Complex Schema with Union

**Input:**
```
Create OrderDataSchema with:
- orderId (string): Order identifier
- status (union): "pending", "processing", "completed", "cancelled"
- items (array of objects with productId, quantity, price)
- shipping (object with address, method, trackingNumber (optional))
- metadata (optional record): Additional order metadata
```

**Output:**
```typescript
// src/types.ts
import { Schema } from "effect";

export const OrderDataSchema = Schema.Struct({
  orderId: Schema.String.annotations({
    description: "Unique order identifier"
  }),
  status: Schema.Union(
    Schema.Literal("pending"),
    Schema.Literal("processing"),
    Schema.Literal("completed"),
    Schema.Literal("cancelled")
  ).annotations({
    description: "Order status (pending, processing, completed, or cancelled)"
  }),
  items: Schema.Array(
    Schema.Struct({
      productId: Schema.String.annotations({
        description: "Product identifier"
      }),
      quantity: Schema.Number.annotations({
        description: "Quantity ordered"
      }),
      price: Schema.Number.annotations({
        description: "Unit price in cents"
      }),
    })
  ).annotations({
    description: "Array of order items"
  }),
  shipping: Schema.Struct({
    address: Schema.String.annotations({
      description: "Shipping address"
    }),
    method: Schema.String.annotations({
      description: "Shipping method (e.g., 'standard', 'express')"
    }),
    trackingNumber: Schema.optional(Schema.String).annotations({
      description: "Optional tracking number"
    }),
  }).annotations({
    description: "Shipping information"
  }),
  metadata: Schema.optional(
    Schema.Record(Schema.String, Schema.Unknown)
  ).annotations({
    description: "Optional additional order metadata"
  }),
});

export type OrderData = Schema.Schema.Type<typeof OrderDataSchema>;
```

## Sub-Schema Pattern

For reusable nested schemas:

```typescript
// Define sub-schema
export const AddressSchema = Schema.Struct({
  street: Schema.String.annotations({ description: "Street address" }),
  city: Schema.String.annotations({ description: "City" }),
  postalCode: Schema.String.annotations({ description: "Postal/ZIP code" }),
  country: Schema.String.annotations({ description: "Country code (ISO 3166-1 alpha-2)" }),
});

export type Address = Schema.Schema.Type<typeof AddressSchema>;

// Use in parent schema
export const CustomerSchema = Schema.Struct({
  customerId: Schema.String.annotations({ description: "Customer ID" }),
  billingAddress: AddressSchema.annotations({ description: "Billing address" }),
  shippingAddress: Schema.optional(AddressSchema).annotations({
    description: "Optional shipping address (defaults to billing)"
  }),
});

export type Customer = Schema.Schema.Type<typeof CustomerSchema>;
```

## Usage in Tools

```typescript
import { Effect, Schema } from "effect";
import { PaymentDataSchema, type PaymentData } from "../types.js";

const createPaymentEffect = (input: PaymentData) =>
  Effect.gen(function* () {
    // input is fully typed!
    const service = yield* PaymentService;
    return yield* service.createPayment(input);
  });

export function registerCreatePaymentTool(server: McpServer): void {
  server.registerTool(
    "create_payment",
    {
      title: "Create Payment",
      description: "Creates a new payment",
      inputSchema: PaymentDataSchema,  // Schema passed directly
    },
    (args) =>
      Effect.runPromise(
        Effect.gen(function* () {
          // Decode and validate
          const input = yield* Schema.decodeUnknown(PaymentDataSchema)(args);
          return yield* createPaymentEffect(input);
        }).pipe(Effect.provide(PaymentService.Default))
      )
  );
}
```

## Guidelines

### Annotations
- ✅ **Always** include `description` annotation for every field
- ✅ Make descriptions detailed - Claude reads these!
- ✅ Include examples in descriptions when helpful
- ✅ Specify formats for strings (ISO dates, currency codes, etc.)
- ✅ Explain constraints or validation rules

### Naming
- ✅ Use PascalCase for schema names (end with "Schema")
- ✅ Use PascalCase for type names (without "Schema" suffix)
- ✅ Use camelCase for field names
- ✅ Be descriptive and specific

### Optional vs Required
- ✅ Make fields required by default
- ✅ Only use `Schema.optional()` when field is truly optional
- ✅ Consider providing defaults in service logic rather than in schema

### Nested Structures
- ✅ Extract complex nested schemas to separate definitions for reusability
- ✅ Annotate both the nested schema and its usage
- ✅ Keep nesting reasonable (2-3 levels max)

### Arrays
- ✅ Always annotate what the array contains
- ✅ Use `Schema.Array(ElementSchema)` for typed arrays
- ✅ Consider using `Schema.NonEmptyArray()` if array must have items

### Type Safety
- ✅ Always generate both Schema and Type
- ✅ Use `Schema.Schema.Type<typeof MySchema>` for type derivation
- ✅ Never manually duplicate types - derive from schema

## Common Patterns by Domain

### Analytics/Metrics
- Date ranges (startDate, endDate)
- Metric arrays (strings)
- Dimension arrays (strings)
- Filter records (key-value)

### E-commerce/Payments
- Amounts (numbers in cents)
- Currency codes (string literals or unions)
- Status enums (unions of literals)
- Nested item arrays

### User/Customer Data
- Identifiers (strings)
- Addresses (nested objects)
- Optional contact info
- Metadata records

## Related

- See `.claude/rules/mcp-server.md` for MCP patterns
- See `.claude/rules/effect-typescript.md` for Effect Schema usage
- See `@mcp-tool` for using schemas in tools
- See Effect Schema docs for advanced patterns
