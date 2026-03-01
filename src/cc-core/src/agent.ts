import {
  query,
  type Options,
  type Query,
  type HookCallback as SdkHookCallback,
} from "@anthropic-ai/claude-agent-sdk";
import type {
  AgentConfig,
  AgentResult,
  McpServerConfig,
  HookCallback,
} from "./types.js";
import { generateSessionId } from "./session.js";

/**
 * Default model for agent execution
 */
export const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

/**
 * Convert AgentConfig to SDK Options
 */
function buildOptions(
  config: AgentConfig,
  options?: ExecuteOptions
): Options {
  const opts: Options = {
    model: config.model ?? DEFAULT_MODEL,
  };

  // Add MCP servers if configured
  if (config.mcpServers && Object.keys(config.mcpServers).length > 0) {
    // Cast to the SDK's McpServerConfig type
    opts.mcpServers = config.mcpServers as Record<string, McpServerConfig> as Options["mcpServers"];
  }

  // Add allowed/disallowed tools
  if (config.allowedTools?.length) {
    opts.allowedTools = config.allowedTools;
  }
  if (config.disallowedTools?.length) {
    opts.disallowedTools = config.disallowedTools;
  }

  // Add permission mode
  if (config.permissionMode) {
    opts.permissionMode = config.permissionMode;
  }

  // Add execution limits
  if (config.maxTurns) {
    opts.maxTurns = config.maxTurns;
  }
  if (config.maxBudgetUsd) {
    opts.maxBudgetUsd = config.maxBudgetUsd;
  }

  // Add working directory
  if (config.cwd) {
    opts.cwd = config.cwd;
  }

  // Add environment variables
  if (config.env) {
    opts.env = config.env;
  }

  // Add system prompt
  if (config.systemPrompt) {
    opts.systemPrompt = config.systemPrompt;
  }

  // Add session ID for resumption
  if (options?.sessionId) {
    opts.resume = options.sessionId;
  }

  // Add persist session setting
  if (config.persistSession !== undefined) {
    opts.persistSession = config.persistSession;
  }

  // Add hooks - cast our hook type to SDK's hook type
  if (options?.hooks?.length) {
    opts.hooks = {
      PreToolUse: [
        {
          // Cast hooks to SDK's HookCallback type
          hooks: options.hooks as unknown as SdkHookCallback[],
        },
      ],
    };
  }

  return opts;
}

/**
 * Options for execute/stream operations
 */
export interface ExecuteOptions {
  /** Session ID to resume */
  sessionId?: string;
  /** Hooks to apply */
  hooks?: HookCallback[];
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Callback for each message during execution (for logging/debugging) */
  onMessage?: (message: AgentMessage) => void;
}

/**
 * Agent instance with configuration
 */
export interface Agent {
  config: AgentConfig;
  execute: (prompt: string, options?: ExecuteOptions) => Promise<AgentResult>;
  stream: (
    prompt: string,
    options?: ExecuteOptions
  ) => AsyncGenerator<AgentMessage, AgentResult, unknown>;
}

/**
 * Message types from agent execution
 */
export interface AgentMessage {
  type: "text" | "tool_use" | "tool_result" | "error";
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  isError?: boolean;
}

/**
 * Create a configured agent instance
 */
export function createAgent(config: AgentConfig): Agent {
  return {
    config,
    execute: (prompt: string, options?: ExecuteOptions) =>
      executeTask(config, prompt, options),
    stream: (prompt: string, options?: ExecuteOptions) =>
      streamTask(config, prompt, options),
  };
}

/**
 * Execute a task with an agent configuration
 */
export async function executeTask(
  config: AgentConfig,
  prompt: string,
  options?: ExecuteOptions
): Promise<AgentResult> {
  try {
    const opts = buildOptions(config, options);

    const queryResult: Query = query({
      prompt,
      options: opts,
    });

    // Collect all messages from the async generator
    const messages: unknown[] = [];
    for await (const message of queryResult) {
      messages.push(message);

      // Call onMessage callback if provided
      if (options?.onMessage) {
        const msg = message as Record<string, unknown>;
        if (msg.type === "assistant" && typeof msg.message === "object") {
          const assistantMsg = msg.message as Record<string, unknown>;
          if (Array.isArray(assistantMsg.content)) {
            for (const content of assistantMsg.content) {
              const c = content as Record<string, unknown>;
              if (c.type === "text" && typeof c.text === "string") {
                options.onMessage({
                  type: "text",
                  content: c.text,
                });
              } else if (c.type === "tool_use") {
                options.onMessage({
                  type: "tool_use",
                  content: c.name as string,
                  toolName: c.name as string,
                  toolInput: c.input as Record<string, unknown>,
                });
              }
            }
          }
        } else if (msg.type === "tool_result") {
          options.onMessage({
            type: "tool_result",
            content: JSON.stringify(msg.content),
            isError: msg.is_error as boolean | undefined,
          });
        }
      }
    }

    // Extract result text from the last assistant message
    let resultText = "Task completed";
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i] as Record<string, unknown>;
      if (msg.type === "assistant" && typeof msg.message === "object") {
        const assistantMsg = msg.message as Record<string, unknown>;
        if (Array.isArray(assistantMsg.content)) {
          const textContent = assistantMsg.content.find(
            (c: Record<string, unknown>) => c.type === "text"
          );
          if (textContent && typeof textContent.text === "string") {
            resultText = textContent.text;
            break;
          }
        }
      }
    }

    // Generate session ID if persistence is enabled
    const sessionId =
      config.persistSession !== false ? generateSessionId() : undefined;

    return {
      success: true,
      result: resultText,
      sessionId,
    };
  } catch (error) {
    return {
      success: false,
      result: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Stream task execution with message events
 */
export async function* streamTask(
  config: AgentConfig,
  prompt: string,
  options?: ExecuteOptions
): AsyncGenerator<AgentMessage, AgentResult, unknown> {
  try {
    const opts = buildOptions(config, options);

    const queryResult: Query = query({
      prompt,
      options: opts,
    });

    let lastText = "";

    for await (const message of queryResult) {
      const msg = message as Record<string, unknown>;

      if (msg.type === "assistant" && typeof msg.message === "object") {
        const assistantMsg = msg.message as Record<string, unknown>;
        if (Array.isArray(assistantMsg.content)) {
          for (const content of assistantMsg.content) {
            const c = content as Record<string, unknown>;
            if (c.type === "text" && typeof c.text === "string") {
              lastText = c.text;
              yield {
                type: "text",
                content: c.text,
              };
            } else if (c.type === "tool_use") {
              yield {
                type: "tool_use",
                content: c.name as string,
                toolName: c.name as string,
                toolInput: c.input as Record<string, unknown>,
              };
            }
          }
        }
      } else if (msg.type === "tool_result") {
        yield {
          type: "tool_result",
          content: JSON.stringify(msg.content),
          isError: msg.is_error as boolean | undefined,
        };
      }
    }

    const sessionId =
      config.persistSession !== false ? generateSessionId() : undefined;

    return {
      success: true,
      result: lastText,
      sessionId,
    };
  } catch (error) {
    yield {
      type: "error",
      content: error instanceof Error ? error.message : String(error),
      isError: true,
    };

    return {
      success: false,
      result: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create an agent builder for fluent configuration
 */
export function agentBuilder(name: string): AgentBuilder {
  return new AgentBuilder(name);
}

/**
 * Fluent builder for agent configuration
 */
export class AgentBuilder {
  private config: AgentConfig;

  constructor(name: string) {
    this.config = { name };
  }

  model(model: string): this {
    this.config.model = model;
    return this;
  }

  mcpServer(name: string, server: McpServerConfig): this {
    if (!this.config.mcpServers) {
      this.config.mcpServers = {};
    }
    this.config.mcpServers[name] = server;
    return this;
  }

  allowTools(...tools: string[]): this {
    if (!this.config.allowedTools) {
      this.config.allowedTools = [];
    }
    this.config.allowedTools.push(...tools);
    return this;
  }

  disallowTools(...tools: string[]): this {
    if (!this.config.disallowedTools) {
      this.config.disallowedTools = [];
    }
    this.config.disallowedTools.push(...tools);
    return this;
  }

  permissionMode(mode: AgentConfig["permissionMode"]): this {
    this.config.permissionMode = mode;
    return this;
  }

  maxTurns(turns: number): this {
    this.config.maxTurns = turns;
    return this;
  }

  maxBudget(usd: number): this {
    this.config.maxBudgetUsd = usd;
    return this;
  }

  cwd(directory: string): this {
    this.config.cwd = directory;
    return this;
  }

  env(variables: Record<string, string>): this {
    this.config.env = { ...this.config.env, ...variables };
    return this;
  }

  systemPrompt(prompt: string): this {
    this.config.systemPrompt = prompt;
    return this;
  }

  persistSession(enabled: boolean): this {
    this.config.persistSession = enabled;
    return this;
  }

  build(): Agent {
    return createAgent(this.config);
  }
}
