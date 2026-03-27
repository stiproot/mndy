import { Effect } from "effect";
import { createLogger } from "mcp-core";
import {
  MarkdownConfig,
  MarkdownGenerationError,
  MarkdownValidationError,
  ConversionError,
  type MarkdownSection,
  type MarkdownList,
  type MarkdownTable,
} from "../types.js";

const logger = createLogger("markdown-service");

export class MarkdownService extends Effect.Service<MarkdownService>()(
  "MarkdownService",
  {
    effect: Effect.gen(function* () {
      const config = yield* MarkdownConfig;

      return {
        /**
         * Generate markdown from structured data
         */
        generateFromSections: (
          title: string,
          sections: MarkdownSection[]
        ) =>
          Effect.gen(function* () {
            logger.debug("Generating markdown from sections", { title });

            try {
              let markdown = `# ${title}\n\n`;

              for (const section of sections) {
                const heading = "#".repeat(section.level);
                markdown += `${heading} ${section.heading}\n\n`;
                markdown += `${section.content}\n\n`;
              }

              logger.info("Markdown generated from sections", { title });
              return markdown.trim();
            } catch (error) {
              yield* Effect.fail(
                new MarkdownGenerationError({
                  message: "Failed to generate markdown from sections",
                  cause: error,
                })
              );
            }
          }),

        /**
         * Generate a markdown list
         */
        generateList: (list: MarkdownList) =>
          Effect.gen(function* () {
            logger.debug("Generating markdown list", {
              items: list.items.length,
              ordered: list.ordered,
            });

            try {
              const lines = list.items.map((item, index) => {
                const prefix = list.ordered ? `${index + 1}.` : "-";
                return `${prefix} ${item}`;
              });

              const markdown = lines.join("\n");
              logger.info("Markdown list generated");
              return markdown;
            } catch (error) {
              yield* Effect.fail(
                new MarkdownGenerationError({
                  message: "Failed to generate markdown list",
                  cause: error,
                })
              );
            }
          }),

        /**
         * Generate a markdown table
         */
        generateTable: (table: MarkdownTable) =>
          Effect.gen(function* () {
            logger.debug("Generating markdown table", {
              headers: table.headers.length,
              rows: table.rows.length,
            });

            try {
              // Validate table structure
              for (const row of table.rows) {
                if (row.length !== table.headers.length) {
                  yield* Effect.fail(
                    new MarkdownGenerationError({
                      message: `Row length (${row.length}) does not match header length (${table.headers.length})`,
                    })
                  );
                }
              }

              // Generate header row
              const headerRow = `| ${table.headers.join(" | ")} |`;

              // Generate separator row with alignment
              const separators = table.headers.map((_, index) => {
                const alignment = table.alignment?.[index] || "left";
                if (alignment === "center") return ":---:";
                if (alignment === "right") return "---:";
                return "---";
              });
              const separatorRow = `| ${separators.join(" | ")} |`;

              // Generate data rows
              const dataRows = table.rows.map(
                (row) => `| ${row.join(" | ")} |`
              );

              const markdown = [headerRow, separatorRow, ...dataRows].join(
                "\n"
              );
              logger.info("Markdown table generated");
              return markdown;
            } catch (error) {
              if (error instanceof MarkdownGenerationError) {
                yield* Effect.fail(error);
              }
              yield* Effect.fail(
                new MarkdownGenerationError({
                  message: "Failed to generate markdown table",
                  cause: error,
                })
              );
            }
          }),

        /**
         * Convert JSON to markdown
         */
        convertJsonToMarkdown: (json: unknown) =>
          Effect.gen(function* () {
            logger.debug("Converting JSON to markdown");

            try {
              const jsonString =
                typeof json === "string" ? json : JSON.stringify(json, null, 2);
              const markdown = `\`\`\`json\n${jsonString}\n\`\`\``;

              logger.info("JSON converted to markdown");
              return markdown;
            } catch (error) {
              yield* Effect.fail(
                new ConversionError({
                  message: "Failed to convert JSON to markdown",
                  format: "json",
                  cause: error,
                })
              );
            }
          }),

        /**
         * Validate markdown syntax
         */
        validateMarkdown: (content: string) =>
          Effect.gen(function* () {
            logger.debug("Validating markdown syntax", {
              length: content.length,
            });

            const errors: string[] = [];

            // Basic validation rules
            const lines = content.split("\n");

            // Check for malformed headers
            lines.forEach((line, index) => {
              const headerMatch = line.match(/^(#{1,6})\s*(.*)$/);
              if (headerMatch) {
                const [, hashes, text] = headerMatch;
                if (!text.trim()) {
                  errors.push(
                    `Line ${index + 1}: Empty heading (${hashes})`
                  );
                }
              }

              // Check for malformed links
              const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g;
              let linkMatch;
              while ((linkMatch = linkRegex.exec(line)) !== null) {
                const [, text, url] = linkMatch;
                if (!text.trim()) {
                  errors.push(`Line ${index + 1}: Empty link text`);
                }
                if (!url.trim()) {
                  errors.push(`Line ${index + 1}: Empty link URL`);
                }
              }
            });

            if (errors.length > 0) {
              logger.warning("Markdown validation found errors", { errors });
              yield* Effect.fail(
                new MarkdownValidationError({
                  message: "Markdown validation failed",
                  errors,
                })
              );
            }

            logger.info("Markdown validation passed");
            return { valid: true, errors: [] };
          }),

        /**
         * Get configuration
         */
        getConfig: () => Effect.succeed(config),
      };
    }),
  }
) {}
