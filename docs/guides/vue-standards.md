# Vue 3 Coding Standards & Best Practices

**Version:** 1.0
**Last Updated:** 2025-03-04
**Purpose:** Comprehensive guide for developer agents and engineers working with Vue 3 + TypeScript

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Component Patterns](#component-patterns)
3. [Reactivity](#reactivity)
4. [Composables](#composables)
5. [State Management (Pinia)](#state-management-pinia)
6. [Component Communication](#component-communication)
7. [Template Best Practices](#template-best-practices)
8. [Performance](#performance)
9. [Anti-Patterns Summary](#anti-patterns-summary)
10. [Quick Reference](#quick-reference)

---

## Core Concepts

### 1. Use `<script setup>` for All Components

**Pattern:** All new Vue components must use the `<script setup>` syntax with TypeScript.

**When to Use:**

- Every new Vue component
- When refactoring existing components

**Key Standards:**

```vue
<!-- GOOD: script setup with TypeScript -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>

<!-- BAD: Options API -->
<script lang="ts">
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubled() {
      return this.count * 2
    }
  }
}
</script>
```

**Common Pitfalls:**

- Using Options API for new components
- Forgetting `lang="ts"` attribute
- Mixing Options API with Composition API

---

### 2. Prefer `ref()` Over `reactive()`

**Pattern:** Use `ref()` for all reactive state. Reserve `reactive()` only for complex object state where you need deep reactivity on nested properties.

**When to Use:**

- All primitive values (strings, numbers, booleans)
- Arrays and objects where you might reassign the entire value
- When you want consistent `.value` access pattern

**Key Standards:**

```typescript
// GOOD: ref for primitives
const count = ref(0)
const name = ref('')
const isLoading = ref(false)

// GOOD: ref for arrays (can reassign)
const items = ref<string[]>([])
items.value = ['a', 'b', 'c'] // Works
items.value.push('d') // Also works

// GOOD: ref for objects (can reassign)
const user = ref<User | null>(null)
user.value = { id: 1, name: 'Alice' }

// OK: reactive for complex nested state (rare)
const formState = reactive({
  personal: { firstName: '', lastName: '' },
  address: { street: '', city: '' }
})

// BAD: reactive for primitives (unnecessary complexity)
const state = reactive({ count: 0 })

// BAD: Destructuring reactive (loses reactivity!)
const { firstName, lastName } = reactive({ firstName: '', lastName: '' })
```

**Common Pitfalls:**

- Destructuring reactive objects (loses reactivity)
- Using reactive when ref would be simpler
- Forgetting `.value` when accessing ref in script

---

### 3. TypeScript-First Development

**Pattern:** Always define types for props, emits, and complex data structures.

**When to Use:**

- All component props and emits
- Store state and actions
- API response types
- Composable return types

**Key Standards:**

```typescript
// GOOD: Explicit interface for props
interface Props {
  title: string
  items: Item[]
  onSelect?: (item: Item) => void
}
const props = defineProps<Props>()

// GOOD: Typed emits
const emit = defineEmits<{
  (e: 'select', item: Item): void
  (e: 'close'): void
}>()

// GOOD: Typed ref
const user = ref<User | null>(null)

// GOOD: Typed computed
const activeItems = computed<Item[]>(() =>
  props.items.filter(item => item.active)
)

// BAD: No types
const props = defineProps(['title', 'items'])
const emit = defineEmits(['select', 'close'])
```

**Common Pitfalls:**

- Using array syntax for props/emits
- Not typing refs that hold complex data
- Missing null/undefined in union types

---

## Component Patterns

### 1. Props with `defineProps<T>()`

**Pattern:** Define props using TypeScript interface with `defineProps<T>()`.

**Key Standards:**

```typescript
// GOOD: Interface with clear types
interface Props {
  // Required props
  id: string
  title: string

  // Optional props
  subtitle?: string
  count?: number

  // Complex types
  items: Item[]
  onItemClick?: (item: Item) => void
}

// Without defaults
const props = defineProps<Props>()

// With defaults using withDefaults
const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  count: 0,
  items: () => [] // Use factory for objects/arrays
})

// Accessing props
console.log(props.title)
console.log(props.items.length)

// BAD: Runtime props definition
const props = defineProps({
  title: String,
  count: { type: Number, default: 0 }
})
```

**Common Pitfalls:**

- Using non-factory defaults for objects/arrays
- Not using `withDefaults` for optional props with defaults
- Mixing TypeScript and runtime prop definitions

---

### 2. Emits with `defineEmits<T>()`

**Pattern:** Define emits using TypeScript for type-safe event emission.

**Key Standards:**

```typescript
// GOOD: Typed emits with payload types
const emit = defineEmits<{
  (e: 'update', value: string): void
  (e: 'delete', id: number): void
  (e: 'close'): void
}>()

// Usage
emit('update', 'new value') // Type-checked
emit('delete', 123)
emit('close')

// BAD: Untyped emits
const emit = defineEmits(['update', 'delete', 'close'])
emit('update', 123) // No type checking!

// GOOD: v-model support
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// In template: <input :value="modelValue" @input="emit('update:modelValue', $event.target.value)">
```

**Common Pitfalls:**

- Array syntax for emits (no type safety)
- Forgetting to emit events when state changes
- Wrong payload types

---

### 3. Slots with `defineSlots<T>()`

**Pattern:** Define typed slots for better component API documentation.

**Key Standards:**

```typescript
// GOOD: Typed slots
const slots = defineSlots<{
  default(props: { item: Item }): any
  header(): any
  footer(props: { count: number }): any
}>()

// Usage in template
// <slot :item="currentItem" />
// <slot name="header" />
// <slot name="footer" :count="items.length" />

// Check if slot is provided
if (slots.header) {
  // Header slot was passed
}
```

---

### 4. Expose Component API with `defineExpose()`

**Pattern:** Explicitly expose component methods/properties for parent access via template refs.

**Key Standards:**

```typescript
// Child component
<script setup lang="ts">
import { ref } from 'vue'

const inputRef = ref<HTMLInputElement>()

function focus() {
  inputRef.value?.focus()
}

function reset() {
  // Reset logic
}

// Explicitly expose public API
defineExpose({
  focus,
  reset
})
</script>

// Parent component
<script setup lang="ts">
import { ref } from 'vue'
import MyInput from './MyInput.vue'

const inputComponent = ref<InstanceType<typeof MyInput>>()

function handleFocus() {
  inputComponent.value?.focus() // Type-safe!
}
</script>

<template>
  <MyInput ref="inputComponent" />
</template>
```

**Common Pitfalls:**

- Exposing internal state instead of methods
- Not typing the template ref properly
- Exposing too much (keep API minimal)

---

### 5. Template Refs with `useTemplateRef()`

**Pattern:** Use `useTemplateRef()` (Vue 3.5+) or typed `ref()` for DOM element references.

**Key Standards:**

```typescript
// GOOD: Vue 3.5+ useTemplateRef
import { useTemplateRef, onMounted } from 'vue'

const inputEl = useTemplateRef<HTMLInputElement>('input')

onMounted(() => {
  inputEl.value?.focus()
})

// Template: <input ref="input" />

// GOOD: Pre-3.5 typed ref
const inputEl = ref<HTMLInputElement | null>(null)

// BAD: Untyped ref
const inputEl = ref(null)
inputEl.value.focus() // No type checking!
```

---

## Reactivity

### 1. `computed()` for Derived State

**Pattern:** Use computed properties for any value derived from reactive state.

**Key Standards:**

```typescript
// GOOD: Computed for derived values
const items = ref<Item[]>([])
const searchQuery = ref('')

const filteredItems = computed(() =>
  items.value.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

const itemCount = computed(() => filteredItems.value.length)

const hasItems = computed(() => itemCount.value > 0)

// GOOD: Writable computed
const firstName = ref('John')
const lastName = ref('Doe')

const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value: string) => {
    const [first, last] = value.split(' ')
    firstName.value = first
    lastName.value = last ?? ''
  }
})

// BAD: Method instead of computed (recalculates every render)
function getFilteredItems() {
  return items.value.filter(/* ... */)
}
```

**Common Pitfalls:**

- Using methods for derived state (no caching)
- Heavy computations without memoization
- Side effects in computed (should be pure)

---

### 2. `watch()` and `watchEffect()` Patterns

**Pattern:** Use `watch()` for specific reactive changes, `watchEffect()` for automatic dependency tracking.

**Key Standards:**

```typescript
import { watch, watchEffect, ref } from 'vue'

const userId = ref<string | null>(null)
const userData = ref<User | null>(null)

// GOOD: watch specific source
watch(userId, async (newId, oldId) => {
  if (newId) {
    userData.value = await fetchUser(newId)
  }
}, { immediate: true }) // Run immediately if needed

// GOOD: watch multiple sources
watch(
  [userId, () => route.params.tab],
  ([newUserId, newTab]) => {
    // Handle changes
  }
)

// GOOD: watchEffect for automatic tracking
watchEffect(async () => {
  if (userId.value) {
    userData.value = await fetchUser(userId.value)
  }
})

// GOOD: Cleanup in watch
watch(userId, (newId, oldId, onCleanup) => {
  const controller = new AbortController()

  fetchUser(newId, { signal: controller.signal })
    .then(data => userData.value = data)

  onCleanup(() => controller.abort())
})

// BAD: Watching everything with watchEffect when specific watch is clearer
watchEffect(() => {
  // Triggers on ANY dependency change
  console.log(userId.value, userData.value, otherState.value)
})
```

**When to Use Each:**

| Use Case | Tool |
|----------|------|
| React to specific value changes | `watch()` |
| Need old and new values | `watch()` |
| Auto-track all dependencies | `watchEffect()` |
| Initial fetch on mount | `watch(..., { immediate: true })` |

---

### 3. Avoiding Reactivity Pitfalls

**Pattern:** Understand common reactivity mistakes and how to avoid them.

**Key Standards:**

```typescript
// BAD: Destructuring reactive (loses reactivity)
const state = reactive({ x: 1, y: 2 })
const { x, y } = state // x and y are NOT reactive!

// GOOD: Use toRefs to maintain reactivity
const { x, y } = toRefs(state) // x.value and y.value are reactive

// GOOD: Or just use refs from the start
const x = ref(1)
const y = ref(2)

// BAD: Replacing reactive object
let state = reactive({ count: 0 })
state = reactive({ count: 1 }) // Lost reactivity connection!

// GOOD: Use ref for replaceable objects
const state = ref({ count: 0 })
state.value = { count: 1 } // Works

// BAD: Direct array index assignment with reactive
const items = reactive([1, 2, 3])
items[0] = 10 // May not trigger updates in some cases

// GOOD: Use ref for arrays
const items = ref([1, 2, 3])
items.value[0] = 10 // Works reliably
items.value = [10, 2, 3] // Also works

// BAD: Async operations losing reactivity context
const data = ref(null)
setTimeout(() => {
  data.value = fetchedData // This is fine
}, 1000)

// But be careful with:
async function loadData() {
  const result = await fetch('/api')
  data.value = result // OK - ref is stable
}
```

---

## Composables

### 1. Naming and Structure

**Pattern:** Composables are functions prefixed with `use` that encapsulate reusable reactive logic.

**Key Standards:**

```typescript
// File: composables/useCounter.ts

import { ref, computed, type Ref } from 'vue'

// GOOD: Named export (required)
export interface UseCounterOptions {
  initial?: number
  min?: number
  max?: number
}

export interface UseCounterReturn {
  count: Ref<number>
  doubled: Ref<number>
  increment: () => void
  decrement: () => void
  reset: () => void
}

export function useCounter(options: UseCounterOptions = {}): UseCounterReturn {
  const { initial = 0, min = -Infinity, max = Infinity } = options

  const count = ref(initial)

  const doubled = computed(() => count.value * 2)

  function increment() {
    if (count.value < max) {
      count.value++
    }
  }

  function decrement() {
    if (count.value > min) {
      count.value--
    }
  }

  function reset() {
    count.value = initial
  }

  return {
    count,
    doubled,
    increment,
    decrement,
    reset
  }
}

// BAD: Default export
export default function useCounter() { /* ... */ }

// BAD: Missing return type interface
export function useCounter() {
  // No clear contract
}
```

---

### 2. Flexible Input Patterns

**Pattern:** Accept `MaybeRefOrGetter` for flexible inputs that work with refs, getters, or plain values.

**Key Standards:**

```typescript
import { ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

// GOOD: Accept flexible input
export function useTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    document.title = toValue(title)
  })
}

// Usage - all work:
useTitle('Static Title')
useTitle(titleRef)
useTitle(() => `${prefix.value} - ${suffix.value}`)

// GOOD: Multiple flexible inputs
export function useFullName(
  firstName: MaybeRefOrGetter<string>,
  lastName: MaybeRefOrGetter<string>
) {
  return computed(() => `${toValue(firstName)} ${toValue(lastName)}`)
}

// Usage
const fullName = useFullName(firstNameRef, 'Smith')
const fullName2 = useFullName(() => form.firstName, () => form.lastName)
```

---

### 3. Return Value Structure

**Pattern:** Return an object with reactive state and methods. Use consistent naming.

**Key Standards:**

```typescript
// GOOD: Clear return structure
export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(toValue(url))
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      isLoading.value = false
    }
  }

  // Auto-fetch on URL change
  watchEffect(() => {
    execute()
  })

  return {
    // State (refs)
    data,
    error,
    isLoading,

    // Actions
    execute,
    refresh: execute
  }
}

// Usage
const { data, isLoading, error, refresh } = useFetch<User[]>('/api/users')
```

---

### 4. Cleanup and Lifecycle

**Pattern:** Handle cleanup properly using lifecycle hooks and cleanup callbacks.

**Key Standards:**

```typescript
import { onMounted, onUnmounted, ref, watch } from 'vue'

export function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (e: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
) {
  onMounted(() => {
    window.addEventListener(event, handler, options)
  })

  onUnmounted(() => {
    window.removeEventListener(event, handler, options)
  })
}

// GOOD: Cleanup in watch
export function useAsyncData<T>(fetcher: () => Promise<T>) {
  const data = ref<T | null>(null)
  const loading = ref(false)

  watch(
    fetcher,
    async (newFetcher, oldFetcher, onCleanup) => {
      const controller = new AbortController()

      onCleanup(() => controller.abort())

      loading.value = true
      try {
        data.value = await newFetcher()
      } finally {
        loading.value = false
      }
    },
    { immediate: true }
  )

  return { data, loading }
}
```

---

## State Management (Pinia)

### 1. Composition Store Syntax

**Pattern:** Use the composition (setup) syntax for Pinia stores.

**Key Standards:**

```typescript
// File: stores/user.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => user.value !== null)

  // Getters (computed)
  const displayName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}` : 'Guest'
  )

  // Actions
  async function login(credentials: Credentials) {
    const response = await authService.login(credentials)
    user.value = response.user
  }

  function logout() {
    user.value = null
  }

  return {
    // State
    user,

    // Getters
    isAuthenticated,
    displayName,

    // Actions
    login,
    logout
  }
})

// BAD: Options syntax (less flexible)
export const useUserStore = defineStore('user', {
  state: () => ({ user: null }),
  getters: { /* ... */ },
  actions: { /* ... */ }
})
```

---

### 2. Store Usage in Components

**Pattern:** Use `storeToRefs` for destructuring reactive state from stores.

**Key Standards:**

```typescript
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user.store'

const userStore = useUserStore()

// GOOD: storeToRefs for reactive state
const { user, isAuthenticated, displayName } = storeToRefs(userStore)

// GOOD: Destructure actions directly (they don't need refs)
const { login, logout } = userStore

// BAD: Direct destructure loses reactivity
const { user } = userStore // user is NOT reactive!

// Usage
async function handleLogin() {
  await login({ email, password })
}
</script>
```

---

### 3. Store Organization

**Pattern:** Organize stores by domain/feature, keep them focused.

**Key Standards:**

```
stores/
├── user.store.ts      # User authentication & profile
├── projects.store.ts  # Project management
├── ui.store.ts        # UI state (modals, sidebars)
└── index.ts           # Re-exports
```

```typescript
// stores/index.ts
export { useUserStore } from './user.store'
export { useProjectsStore } from './projects.store'
export { useUIStore } from './ui.store'
```

---

## Component Communication

### 1. Props Down, Events Up

**Pattern:** Data flows down via props, changes propagate up via events.

**Key Standards:**

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const selectedItem = ref<Item | null>(null)

function handleSelect(item: Item) {
  selectedItem.value = item
}
</script>

<template>
  <ChildComponent
    :selected-item="selectedItem"
    @select="handleSelect"
  />
</template>

<!-- ChildComponent.vue -->
<script setup lang="ts">
interface Props {
  selectedItem: Item | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', item: Item): void
}>()

// GOOD: Emit to parent instead of mutating prop
function selectItem(item: Item) {
  emit('select', item)
}

// BAD: Direct prop mutation
function selectItem(item: Item) {
  props.selectedItem = item // Error! Props are readonly
}
</script>
```

---

### 2. Provide/Inject for Deep Injection

**Pattern:** Use provide/inject for deeply nested component communication.

**Key Standards:**

```typescript
// Parent component
import { provide, ref } from 'vue'
import type { InjectionKey } from 'vue'

// GOOD: Typed injection key
interface ThemeContext {
  theme: Ref<'light' | 'dark'>
  toggleTheme: () => void
}

export const ThemeKey: InjectionKey<ThemeContext> = Symbol('theme')

// In parent setup
const theme = ref<'light' | 'dark'>('light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

provide(ThemeKey, {
  theme,
  toggleTheme
})

// Child component (any depth)
import { inject } from 'vue'
import { ThemeKey } from './theme'

const themeContext = inject(ThemeKey)

if (!themeContext) {
  throw new Error('ThemeKey not provided')
}

const { theme, toggleTheme } = themeContext

// Or with default value
const themeContext = inject(ThemeKey, {
  theme: ref('light'),
  toggleTheme: () => {}
})
```

---

### 3. When to Use Each Pattern

| Pattern | Use Case |
|---------|----------|
| Props/Emits | Direct parent-child communication |
| Provide/Inject | Deep component trees, themes, config |
| Pinia Store | Shared state across unrelated components |
| Composables | Shared logic, not necessarily state |

---

## Template Best Practices

### 1. `v-for` with Proper Keys

**Pattern:** Always use unique, stable keys with `v-for`.

**Key Standards:**

```vue
<!-- GOOD: Unique ID as key -->
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>

<!-- GOOD: Compound key when needed -->
<div v-for="(item, index) in items" :key="`${item.type}-${item.id}`">

<!-- BAD: Index as key (causes issues with reordering) -->
<div v-for="(item, index) in items" :key="index">

<!-- BAD: Non-unique key -->
<div v-for="item in items" :key="item.type">

<!-- BAD: Missing key -->
<div v-for="item in items">
```

---

### 2. `v-if` vs `v-show`

**Pattern:** Use `v-if` for conditional rendering, `v-show` for frequent toggles.

**Key Standards:**

```vue
<!-- GOOD: v-if for rarely changing conditions -->
<AdminPanel v-if="user.isAdmin" />

<!-- GOOD: v-if for expensive components -->
<HeavyChart v-if="showChart" />

<!-- GOOD: v-show for frequent toggles -->
<Dropdown v-show="isOpen" />

<!-- GOOD: v-if with v-else-if chain -->
<LoadingSpinner v-if="isLoading" />
<ErrorMessage v-else-if="error" :error="error" />
<DataDisplay v-else :data="data" />

<!-- BAD: v-if for dropdown (expensive toggle) -->
<Dropdown v-if="isOpen" />

<!-- NOTE: v-if has higher toggle cost, v-show has higher initial cost -->
```

| Directive | Initial Cost | Toggle Cost | Use When |
|-----------|--------------|-------------|----------|
| `v-if` | Low (not rendered) | High (re-render) | Condition rarely changes |
| `v-show` | High (always rendered) | Low (CSS display) | Frequent toggling |

---

### 3. Event Handling

**Pattern:** Use method handlers for complex logic, inline for simple operations.

**Key Standards:**

```vue
<script setup lang="ts">
function handleSubmit(event: Event) {
  event.preventDefault()
  // Complex logic
}

function handleItemClick(item: Item, event: MouseEvent) {
  // Handle with item context
}
</script>

<template>
  <!-- GOOD: Method reference for complex handlers -->
  <form @submit.prevent="handleSubmit">

  <!-- GOOD: Inline for simple state changes -->
  <button @click="isOpen = !isOpen">Toggle</button>

  <!-- GOOD: Passing arguments -->
  <div
    v-for="item in items"
    :key="item.id"
    @click="handleItemClick(item, $event)"
  >

  <!-- GOOD: Event modifiers -->
  <button @click.stop="handleClick">Stop Propagation</button>
  <input @keyup.enter="submit">
  <form @submit.prevent="handleSubmit">

  <!-- BAD: Inline complex logic -->
  <button @click="items = items.filter(i => i.id !== item.id); emit('delete', item.id); trackEvent('delete')">
</template>
```

---

## Performance

### 1. `v-memo` for Expensive Lists

**Pattern:** Use `v-memo` to skip re-renders of list items that haven't changed.

**Key Standards:**

```vue
<!-- GOOD: v-memo for expensive list items -->
<div
  v-for="item in items"
  :key="item.id"
  v-memo="[item.id, item.updated, selectedId === item.id]"
>
  <ExpensiveComponent :item="item" :selected="selectedId === item.id" />
</div>

<!-- Only re-renders when memo dependencies change -->
```

---

### 2. `shallowRef` for Large Objects

**Pattern:** Use `shallowRef` when you only need to track reference changes, not deep mutations.

**Key Standards:**

```typescript
import { shallowRef } from 'vue'

// GOOD: shallowRef for large data that's replaced, not mutated
const largeDataset = shallowRef<DataPoint[]>([])

// Replace entire array (triggers reactivity)
largeDataset.value = await fetchLargeDataset()

// BAD: Deep ref for large data (expensive tracking)
const largeDataset = ref<DataPoint[]>([])

// GOOD: shallowRef for external objects
const chartInstance = shallowRef<Chart | null>(null)
chartInstance.value = new Chart(/* ... */)
```

---

### 3. Lazy Loading Components

**Pattern:** Use `defineAsyncComponent` for code splitting large components.

**Key Standards:**

```typescript
import { defineAsyncComponent } from 'vue'

// GOOD: Lazy load heavy components
const HeavyChart = defineAsyncComponent(() =>
  import('./HeavyChart.vue')
)

// GOOD: With loading/error states
const HeavyChart = defineAsyncComponent({
  loader: () => import('./HeavyChart.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200, // Show loading after 200ms
  timeout: 10000
})

// Usage in template
<Suspense>
  <HeavyChart :data="chartData" />
  <template #fallback>
    <LoadingSpinner />
  </template>
</Suspense>
```

---

### 4. Computed Caching

**Pattern:** Leverage computed's built-in caching for expensive calculations.

**Key Standards:**

```typescript
// GOOD: Expensive calculation in computed (cached)
const sortedItems = computed(() => {
  console.log('Sorting...') // Only logs when items change
  return [...items.value].sort((a, b) => a.name.localeCompare(b.name))
})

// Access multiple times - only calculates once
console.log(sortedItems.value.length)
console.log(sortedItems.value[0])

// BAD: Method (recalculates every call)
function getSortedItems() {
  console.log('Sorting...') // Logs on every call
  return [...items.value].sort((a, b) => a.name.localeCompare(b.name))
}
```

---

## Anti-Patterns Summary

### Critical (Must Avoid)

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Options API in new code | Inconsistent, verbose | Use `<script setup>` |
| Mutating props | Breaks one-way data flow | Emit events to parent |
| Destructuring reactive | Loses reactivity | Use `toRefs()` or `ref()` |
| Missing v-for keys | Rendering bugs, poor perf | Always use unique `:key` |

### Warnings (Should Avoid)

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Index as v-for key | Reordering issues | Use unique ID |
| Method instead of computed | No caching | Use `computed()` |
| Deep ref for large data | Performance | Use `shallowRef()` |
| Side effects in computed | Unexpected behavior | Use `watch()` |
| Inline complex handlers | Hard to read/test | Extract to methods |

### Code Examples

```typescript
// BAD: Options API
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}

// GOOD: Composition API
const count = ref(0)
const increment = () => count.value++

// BAD: Prop mutation
props.title = 'new title'

// GOOD: Event emission
emit('update:title', 'new title')

// BAD: Reactive destructuring
const { x, y } = reactive({ x: 1, y: 2 })

// GOOD: toRefs or ref
const { x, y } = toRefs(reactive({ x: 1, y: 2 }))
// Or just use ref
const x = ref(1)
const y = ref(2)
```

---

## Quick Reference

### Component Template

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMyComposable } from '@/composables/useMyComposable'

// Props
interface Props {
  title: string
  items?: Item[]
}
const props = withDefaults(defineProps<Props>(), {
  items: () => []
})

// Emits
const emit = defineEmits<{
  (e: 'select', item: Item): void
  (e: 'close'): void
}>()

// Composables
const { data, loading } = useMyComposable()

// State
const isOpen = ref(false)

// Computed
const itemCount = computed(() => props.items.length)

// Watchers
watch(() => props.title, (newTitle) => {
  console.log('Title changed:', newTitle)
})

// Methods
function handleSelect(item: Item) {
  emit('select', item)
}
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="item in items" :key="item.id" @click="handleSelect(item)">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Component styles */
</style>
```

### Composable Template

```typescript
import { ref, computed, watch, type Ref, type MaybeRefOrGetter, toValue } from 'vue'

export interface UseExampleOptions {
  initial?: string
}

export interface UseExampleReturn {
  value: Ref<string>
  isEmpty: Ref<boolean>
  setValue: (v: string) => void
  clear: () => void
}

export function useExample(options: UseExampleOptions = {}): UseExampleReturn {
  const { initial = '' } = options

  const value = ref(initial)
  const isEmpty = computed(() => value.value.length === 0)

  function setValue(v: string) {
    value.value = v
  }

  function clear() {
    value.value = ''
  }

  return {
    value,
    isEmpty,
    setValue,
    clear
  }
}
```

### Store Template

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useExampleStore = defineStore('example', () => {
  // State
  const items = ref<Item[]>([])
  const loading = ref(false)

  // Getters
  const itemCount = computed(() => items.value.length)

  // Actions
  async function fetchItems() {
    loading.value = true
    try {
      items.value = await api.getItems()
    } finally {
      loading.value = false
    }
  }

  function addItem(item: Item) {
    items.value.push(item)
  }

  return {
    items,
    loading,
    itemCount,
    fetchItems,
    addItem
  }
})
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserCard.vue` |
| Composables | `use` prefix | `useCounter.ts` |
| Stores | `.store.ts` suffix | `user.store.ts` |
| Props | camelCase | `itemCount` |
| Events | kebab-case (template) | `@item-selected` |
| CSS classes | kebab-case | `.user-card` |

---

## Additional Resources

- Official Vue 3 Documentation: <https://vuejs.org>
- VueUse (Composables Collection): <https://vueuse.org>
- Pinia Documentation: <https://pinia.vuejs.org>
- Vue TypeScript Guide: <https://vuejs.org/guide/typescript/overview>

---

End of Vue 3 Standards Document.
