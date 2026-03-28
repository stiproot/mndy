/**
 * Console formatter for SSE events
 */

import type { SSEEvent } from "./sse-client.js";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

/**
 * Format timestamp for display
 */
function timestamp(): string {
  return new Date().toISOString().split("T")[1].slice(0, 12);
}

/**
 * Format and print SSE event to console
 */
export function formatSSEEvent(event: SSEEvent): void {
  const ts = `${colors.dim}[${timestamp()}]${colors.reset}`;

  switch (event.type) {
    case "start":
      console.log(
        `${ts} ${colors.bright}${colors.green}[START]${colors.reset}`,
        JSON.stringify(event.data)
      );
      break;

    case "phase": {
      const phase = event.data as {
        phase: string;
        status: string;
        message?: string;
      };
      const statusColor =
        phase.status === "completed"
          ? colors.green
          : phase.status === "failed"
            ? colors.red
            : colors.yellow;
      console.log(
        `${ts} ${colors.cyan}[PHASE]${colors.reset} ${statusColor}${phase.phase}${colors.reset} ${phase.status}`,
        phase.message || ""
      );
      break;
    }

    case "text": {
      const text = event.data as { content?: string };
      if (text.content) {
        process.stdout.write(text.content);
      }
      break;
    }

    case "tool": {
      const tool = event.data as { tool: string; input?: Record<string, unknown> };
      console.log(
        `\n${ts} ${colors.magenta}[TOOL]${colors.reset} ${colors.bright}${tool.tool}${colors.reset}`
      );
      if (tool.input) {
        console.log(
          `${colors.dim}${JSON.stringify(tool.input, null, 2)}${colors.reset}`
        );
      }
      break;
    }

    case "error": {
      const error = event.data as { message: string; code?: string };
      console.error(
        `\n${ts} ${colors.bright}${colors.red}[ERROR]${colors.reset}`,
        error.message,
        error.code || ""
      );
      break;
    }

    case "complete":
      console.log(
        `\n${ts} ${colors.bright}${colors.blue}[COMPLETE]${colors.reset}`
      );
      if (event.data && typeof event.data === "object") {
        console.log(JSON.stringify(event.data, null, 2));
      }
      break;

    case "done":
      console.log(
        `\n${ts} ${colors.bright}${colors.green}[DONE]${colors.reset} Stream completed\n`
      );
      break;

    default:
      console.log(`${ts} ${colors.dim}[${event.type}]${colors.reset}`, event.data);
  }
}

/**
 * Track markdown MCP tool usage
 */
export class MarkdownMcpTracker {
  private markdownToolsUsed = new Set<string>();

  track(event: SSEEvent): void {
    if (event.type === "tool") {
      const tool = event.data as { tool: string };
      if (
        tool.tool?.includes("markdown") ||
        tool.tool?.startsWith("md_") ||
        tool.tool?.startsWith("markdown_")
      ) {
        this.markdownToolsUsed.add(tool.tool);
      }
    }
  }

  report(): void {
    console.log(
      `${colors.bright}=== Markdown MCP Integration Check ===${colors.reset}`
    );
    if (this.markdownToolsUsed.size > 0) {
      console.log(
        `${colors.green}✓${colors.reset} Markdown MCP tools used: ${Array.from(this.markdownToolsUsed).join(", ")}`
      );
    } else {
      console.log(
        `${colors.yellow}⚠${colors.reset} No markdown MCP tools were called`
      );
    }
  }
}
