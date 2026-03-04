---
name: vue-composable
description: Generate Vue 3 composable boilerplate. Auto-invoked when creating reusable logic.
---

# Vue Composable Generator

Generate a Vue 3 composable for `$ARGUMENTS`.

## Composable Template

Create the composable file with this structure:

```typescript
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  type Ref,
  type MaybeRefOrGetter,
  toValue
} from 'vue'

// ============================================
// Types
// ============================================
export interface Use${NAME}Options {
  ${OPTION_NAME}?: ${OPTION_TYPE}
}

export interface Use${NAME}Return {
  // State refs
  ${STATE_NAME}: Ref<${STATE_TYPE}>

  // Computed refs
  ${COMPUTED_NAME}: Ref<${COMPUTED_TYPE}>

  // Methods
  ${METHOD_NAME}: (${PARAMS}) => ${RETURN_TYPE}
}

// ============================================
// Composable
// ============================================
export function use${NAME}(
  options: Use${NAME}Options = {}
): Use${NAME}Return {
  const { ${OPTION_NAME} = ${DEFAULT_VALUE} } = options

  // ----------------------------------------
  // State
  // ----------------------------------------
  const ${STATE_NAME} = ref<${STATE_TYPE}>(${INITIAL_VALUE})

  // ----------------------------------------
  // Computed
  // ----------------------------------------
  const ${COMPUTED_NAME} = computed(() => {
    return ${COMPUTED_EXPRESSION}
  })

  // ----------------------------------------
  // Methods
  // ----------------------------------------
  function ${METHOD_NAME}(${PARAMS}: ${PARAM_TYPE}): ${RETURN_TYPE} {
    // Implementation
  }

  // ----------------------------------------
  // Lifecycle
  // ----------------------------------------
  onMounted(() => {
    // Setup on mount
  })

  onUnmounted(() => {
    // Cleanup on unmount
  })

  // ----------------------------------------
  // Return
  // ----------------------------------------
  return {
    // State
    ${STATE_NAME},

    // Computed
    ${COMPUTED_NAME},

    // Methods
    ${METHOD_NAME}
  }
}
```

## Common Patterns

### Data Fetching Composable

```typescript
import { ref, watch, type Ref, type MaybeRefOrGetter, toValue } from 'vue'

export interface UseFetchOptions<T> {
  immediate?: boolean
  initialData?: T
}

export interface UseFetchReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  isLoading: Ref<boolean>
  execute: () => Promise<void>
  refresh: () => Promise<void>
}

export function useFetch<T>(
  url: MaybeRefOrGetter<string>,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
  const { immediate = true, initialData = null } = options

  const data = ref<T | null>(initialData) as Ref<T | null>
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(toValue(url))
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      isLoading.value = false
    }
  }

  // Auto-fetch when URL changes
  watch(
    () => toValue(url),
    () => {
      if (immediate) execute()
    },
    { immediate }
  )

  return {
    data,
    error,
    isLoading,
    execute,
    refresh: execute
  }
}
```

### Toggle Composable

```typescript
import { ref, type Ref } from 'vue'

export interface UseToggleReturn {
  value: Ref<boolean>
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
}

export function useToggle(initial = false): UseToggleReturn {
  const value = ref(initial)

  function toggle() {
    value.value = !value.value
  }

  function setTrue() {
    value.value = true
  }

  function setFalse() {
    value.value = false
  }

  return {
    value,
    toggle,
    setTrue,
    setFalse
  }
}
```

### Event Listener Composable

```typescript
import { onMounted, onUnmounted, type MaybeRefOrGetter, toValue } from 'vue'

export function useEventListener<K extends keyof WindowEventMap>(
  target: MaybeRefOrGetter<Window | HTMLElement | null>,
  event: K,
  handler: (e: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
): void {
  onMounted(() => {
    const el = toValue(target)
    el?.addEventListener(event, handler as EventListener, options)
  })

  onUnmounted(() => {
    const el = toValue(target)
    el?.removeEventListener(event, handler as EventListener, options)
  })
}
```

### Debounced Ref Composable

```typescript
import { ref, watch, type Ref, type MaybeRefOrGetter, toValue } from 'vue'

export function useDebouncedRef<T>(
  source: MaybeRefOrGetter<T>,
  delay = 300
): Ref<T> {
  const debounced = ref<T>(toValue(source)) as Ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(
    () => toValue(source),
    (newValue) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        debounced.value = newValue
      }, delay)
    }
  )

  return debounced
}
```

### Async State Composable

```typescript
import { ref, type Ref } from 'vue'

export interface UseAsyncStateReturn<T> {
  state: Ref<T>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  execute: () => Promise<T>
}

export function useAsyncState<T>(
  fn: () => Promise<T>,
  initialState: T
): UseAsyncStateReturn<T> {
  const state = ref<T>(initialState) as Ref<T>
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function execute(): Promise<T> {
    isLoading.value = true
    error.value = null

    try {
      const result = await fn()
      state.value = result
      return result
    } catch (e) {
      error.value = e as Error
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    state,
    isLoading,
    error,
    execute
  }
}
```

## File Naming

- Prefix with `use`: `useCounter.ts`, `useFetch.ts`
- camelCase: `useLocalStorage.ts`, `useEventListener.ts`
- Descriptive names: `useUserAuthentication.ts`

## Placement

```
src/
└── composables/
    ├── index.ts           # Re-exports
    ├── useCounter.ts
    ├── useFetch.ts
    ├── useToggle.ts
    └── useLocalStorage.ts
```

## Re-export Pattern

```typescript
// composables/index.ts
export { useCounter } from './useCounter'
export { useFetch } from './useFetch'
export { useToggle } from './useToggle'

// Usage in components
import { useCounter, useFetch } from '@/composables'
```

## Checklist

- [ ] Named export (no default export)
- [ ] Function prefixed with `use`
- [ ] TypeScript interfaces for options and return
- [ ] Accepts `MaybeRefOrGetter` for flexible inputs
- [ ] Uses `toValue()` for unwrapping inputs
- [ ] Returns object with state refs and methods
- [ ] Cleanup in `onUnmounted` if needed
- [ ] No side effects on import

## Reference

See `docs/guides/vue-standards.md` section "Composables".
