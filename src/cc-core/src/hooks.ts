import type { PreToolUseInput, HookResult, HookCallback } from "./types.js";

/**
 * Audit log entry for tool usage
 */
export interface AuditLogEntry {
  timestamp: Date;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolUseId: string;
}

/**
 * Audit logger interface
 */
export interface AuditLogger {
  log: (entry: AuditLogEntry) => void | Promise<void>;
}

/**
 * Create a hook that logs all tool usage for auditing
 */
export function createAuditHook(logger: AuditLogger): HookCallback {
  return async (
    input: PreToolUseInput,
    toolUseId: string
  ): Promise<HookResult> => {
    await logger.log({
      timestamp: new Date(),
      toolName: input.tool_name,
      toolInput: input.tool_input,
      toolUseId,
    });

    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
      },
    };
  };
}

/**
 * Create a simple console audit hook
 */
export function createConsoleAuditHook(): HookCallback {
  return createAuditHook({
    log: (entry) => {
      console.log(
        `[AUDIT] ${entry.timestamp.toISOString()} - ${entry.toolName}`,
        JSON.stringify(entry.toolInput)
      );
    },
  });
}

/**
 * Blocked command pattern
 */
export interface BlockedPattern {
  /** Tool name to match */
  toolName: string;
  /** Optional input pattern to match (regex string or function) */
  inputPattern?: string | ((input: Record<string, unknown>) => boolean);
  /** Reason for blocking */
  reason: string;
}

/**
 * Create a hook that blocks dangerous operations
 */
export function createBlockingHook(
  blockedPatterns: BlockedPattern[]
): HookCallback {
  return async (input: PreToolUseInput): Promise<HookResult> => {
    for (const pattern of blockedPatterns) {
      if (input.tool_name !== pattern.toolName) {
        continue;
      }

      // Check input pattern if specified
      if (pattern.inputPattern) {
        if (typeof pattern.inputPattern === "function") {
          if (!pattern.inputPattern(input.tool_input)) {
            continue;
          }
        } else {
          const regex = new RegExp(pattern.inputPattern);
          const inputStr = JSON.stringify(input.tool_input);
          if (!regex.test(inputStr)) {
            continue;
          }
        }
      }

      // Pattern matched, block the operation
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: pattern.reason,
        },
      };
    }

    // No patterns matched, allow
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
      },
    };
  };
}

/**
 * Create a hook that blocks common dangerous Bash commands
 */
export function createSafetyHook(): HookCallback {
  return createBlockingHook([
    {
      toolName: "Bash",
      inputPattern: "rm\\s+-rf\\s+/",
      reason: "Dangerous: recursive delete from root",
    },
    {
      toolName: "Bash",
      inputPattern: ":(){ :|:& };:",
      reason: "Dangerous: fork bomb",
    },
    {
      toolName: "Bash",
      inputPattern: "dd\\s+if=.*of=/dev/",
      reason: "Dangerous: disk overwrite",
    },
    {
      toolName: "Bash",
      inputPattern: "mkfs\\.",
      reason: "Dangerous: filesystem format",
    },
    {
      toolName: "Bash",
      inputPattern: "chmod\\s+-R\\s+777\\s+/",
      reason: "Dangerous: recursive permission change from root",
    },
  ]);
}

/**
 * Approval callback type
 */
export type ApprovalCallback = (
  toolName: string,
  input: Record<string, unknown>
) => Promise<boolean>;

/**
 * Create a hook that requires approval for certain tools
 */
export function createApprovalHook(
  requireApproval: string[],
  approvalCallback: ApprovalCallback
): HookCallback {
  const approvalSet = new Set(requireApproval);

  return async (input: PreToolUseInput): Promise<HookResult> => {
    if (!approvalSet.has(input.tool_name)) {
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
        },
      };
    }

    const approved = await approvalCallback(input.tool_name, input.tool_input);

    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: approved ? "allow" : "deny",
        permissionDecisionReason: approved
          ? "User approved"
          : "User denied",
      },
    };
  };
}

/**
 * Combine multiple hooks (runs all in sequence)
 */
export function combineHooks(...hooks: HookCallback[]): HookCallback {
  return async (
    input: PreToolUseInput,
    toolUseId: string,
    options: { signal: AbortSignal }
  ): Promise<HookResult> => {
    for (const hook of hooks) {
      const result = await hook(input, toolUseId, options);

      // If any hook denies, stop and return denial
      if (result.hookSpecificOutput?.permissionDecision === "deny") {
        return result;
      }
    }

    // All hooks passed
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
      },
    };
  };
}
