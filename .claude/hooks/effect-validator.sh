#!/bin/bash
# Effect-TS Anti-Pattern Validator
# Blocks common Effect-TS mistakes before they're saved
#
# Exit codes:
#   0 - Allow (no issues or non-TypeScript file)
#   2 - Block (anti-pattern detected)

set -e

# Read input from stdin (JSON with tool_input)
INPUT=$(cat)

# Extract file path
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check TypeScript files in src/
if [[ ! "$FILE_PATH" =~ ^.*src/.*\.ts$ ]]; then
  exit 0
fi

# Extract the new content being written
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // empty')

# If no content to check, allow
if [[ -z "$NEW_CONTENT" ]]; then
  exit 0
fi

# Anti-pattern 1: try-catch inside Effect.gen
# This is a critical anti-pattern that bypasses Effect's error handling
if echo "$NEW_CONTENT" | grep -qE 'Effect\.gen.*function\*.*\{' && echo "$NEW_CONTENT" | grep -q 'try.*{'; then
  # Check if try-catch appears after Effect.gen on same or nearby lines
  if echo "$NEW_CONTENT" | grep -qE 'yield\*.*try|try.*yield\*'; then
    echo "BLOCKED: Don't use try-catch inside Effect.gen" >&2
    echo "" >&2
    echo "Instead of:" >&2
    echo "  Effect.gen(function* () {" >&2
    echo "    try { yield* operation; } catch (e) { ... }" >&2
    echo "  })" >&2
    echo "" >&2
    echo "Use:" >&2
    echo "  operation.pipe(" >&2
    echo "    Effect.catchTag('ErrorType', (e) => handleError(e))" >&2
    echo "  )" >&2
    exit 2
  fi
fi

# Anti-pattern 2: await Effect.runPromise inside async function
# This mixes paradigms incorrectly
if echo "$NEW_CONTENT" | grep -qE 'async.*function|async.*=>'; then
  if echo "$NEW_CONTENT" | grep -qE 'await.*Effect\.(runPromise|runSync)'; then
    echo "BLOCKED: Don't mix async/await with Effect.runPromise in the same function" >&2
    echo "" >&2
    echo "Instead of:" >&2
    echo "  async function handler() {" >&2
    echo "    const result = await Effect.runPromise(effect);" >&2
    echo "  }" >&2
    echo "" >&2
    echo "Use:" >&2
    echo "  const handler = Effect.gen(function* () {" >&2
    echo "    const result = yield* effect;" >&2
    echo "  });" >&2
    exit 2
  fi
fi

# Anti-pattern 3: new Error() instead of TaggedError
# Only flag if it's being used with Effect.fail
if echo "$NEW_CONTENT" | grep -qE 'Effect\.fail\(new Error\('; then
  echo "BLOCKED: Use Data.TaggedError instead of generic Error with Effect.fail" >&2
  echo "" >&2
  echo "Instead of:" >&2
  echo "  Effect.fail(new Error('Something went wrong'))" >&2
  echo "" >&2
  echo "Use:" >&2
  echo "  class MyError extends Data.TaggedError('MyError')<{ message: string }> {}" >&2
  echo "  Effect.fail(new MyError({ message: 'Something went wrong' }))" >&2
  exit 2
fi

# Anti-pattern 4: Module-level singleton instantiation of known clients
# Check for common patterns that should be services
SINGLETON_PATTERNS=(
  "^const.*=.*new DaprClient"
  "^const.*=.*new OktaJwtVerifier"
  "^let.*=.*new DaprClient"
  "^let.*=.*new OktaJwtVerifier"
)

for pattern in "${SINGLETON_PATTERNS[@]}"; do
  if echo "$NEW_CONTENT" | grep -qE "$pattern"; then
    echo "BLOCKED: Don't create module-level client singletons" >&2
    echo "" >&2
    echo "Instead of:" >&2
    echo "  const client = new DaprClient({ ... });" >&2
    echo "  export function getState(key) { client.state.get(key); }" >&2
    echo "" >&2
    echo "Use:" >&2
    echo "  export class StateManager extends Effect.Service<StateManager>()('StateManager', {" >&2
    echo "    effect: Effect.gen(function* () {" >&2
    echo "      const client = new DaprClient({ ... });" >&2
    echo "      return { getState: (key) => Effect.tryPromise(() => client.state.get(key)) };" >&2
    echo "    })," >&2
    echo "  }) {}" >&2
    exit 2
  fi
done

# All checks passed
exit 0
