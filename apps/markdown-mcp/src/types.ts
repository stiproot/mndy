import { Config, Data, Schema } from "effect";

// ==================== Configuration ====================

export const ServerConfig = Config.all({
  port: Config.integer("PORT").pipe(Config.withDefault(3008)),
  logLevel: Config.string("LOG_LEVEL").pipe(Config.withDefault("info")),
});

export const MarkdownConfig = Config.all({
  templatesDir: Config.string("TEMPLATES_DIR").pipe(
    Config.withDefault("./templates")
  ),
  outputDir: Config.string("OUTPUT_DIR").pipe(Config.withDefault("./output")),
  maxFileSize: Config.integer("MAX_FILE_SIZE").pipe(
    Config.withDefault(1024 * 1024)
  ), // 1MB default
});

// ==================== Errors ====================

export class MarkdownGenerationError extends Data.TaggedError(
  "MarkdownGenerationError"
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class MarkdownValidationError extends Data.TaggedError(
  "MarkdownValidationError"
)<{
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly errors?: string[];
}> {}

export class TemplateNotFoundError extends Data.TaggedError(
  "TemplateNotFoundError"
)<{
  readonly message: string;
  readonly templateName: string;
}> {}

export class ConversionError extends Data.TaggedError("ConversionError")<{
  readonly message: string;
  readonly format?: string;
  readonly cause?: unknown;
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly message: string;
  readonly operation: string;
  readonly duration?: number;
}> {}

export class ConfigError extends Data.TaggedError("ConfigError")<{
  readonly message: string;
  readonly field?: string;
}> {}

// ==================== Schemas ====================

// Schema for markdown sections
export const MarkdownSectionSchema = Schema.Struct({
  heading: Schema.String.annotations({
    description: "Section heading text",
  }),
  level: Schema.Number.annotations({
    description: "Heading level (1-6)",
  }).pipe(Schema.int(), Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(6)),
  content: Schema.String.annotations({
    description: "Section content (can include markdown formatting)",
  }),
});

export type MarkdownSection = Schema.Schema.Type<typeof MarkdownSectionSchema>;

// Schema for list items
export const MarkdownListSchema = Schema.Struct({
  items: Schema.Array(Schema.String).annotations({
    description: "List items",
  }),
  ordered: Schema.optionalWith(Schema.Boolean, { default: () => false }).annotations({
    description: "Whether the list is ordered (numbered) or unordered (bullets)",
  }),
});

export type MarkdownList = Schema.Schema.Type<typeof MarkdownListSchema>;

// Schema for markdown table
export const MarkdownTableSchema = Schema.Struct({
  headers: Schema.Array(Schema.String).annotations({
    description: "Table column headers",
  }),
  rows: Schema.Array(Schema.Array(Schema.String)).annotations({
    description: "Table rows (each row is an array of cell values)",
  }),
  alignment: Schema.optional(
    Schema.Array(
      Schema.Literal("left", "center", "right")
    ).annotations({
      description: "Column alignment (left, center, or right)",
    })
  ),
});

export type MarkdownTable = Schema.Schema.Type<typeof MarkdownTableSchema>;
