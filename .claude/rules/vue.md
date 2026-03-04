# Vue 3 TypeScript Rules

When writing or modifying Vue code in this project, follow these modern Vue 3 patterns:

## Core Principles

1. **Use `<script setup>`** - All new components must use `<script setup lang="ts">`
2. **TypeScript required** - Full typing for props, emits, and refs
3. **Composition API only** - No Options API in new code
4. **Prefer `ref()` over `reactive()`** - More consistent and flexible
5. **Extract to composables** - Reusable logic goes in `composables/` directory

## Component Structure

```vue
<script setup lang="ts">
// 1. Imports (Vue, then libs, then local)
import { ref, computed } from 'vue'

// 2. Props with TypeScript interface
interface Props {
  title: string
  count?: number
}
const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// 3. Emits with TypeScript
const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

// 4. Composables
const { data, loading } = useMyComposable()

// 5. Reactive state
const isOpen = ref(false)

// 6. Computed
const displayTitle = computed(() => props.title.toUpperCase())

// 7. Methods
function handleClick() {
  emit('update', 'clicked')
}
</script>

<template>
  <!-- Template content -->
</template>

<style scoped>
/* Scoped styles */
</style>
```

## Naming Conventions

- **Components**: PascalCase files and names (`UserCard.vue`)
- **Composables**: `use` prefix, camelCase (`useCounter.ts`)
- **Props/Emits**: camelCase in script, kebab-case in template
- **Stores**: camelCase with `.store.ts` suffix

## Composables Pattern

```typescript
// GOOD: Named export with use prefix
export function useCounter(initial = 0) {
  const count = ref(initial)
  const increment = () => count.value++
  return { count, increment }
}

// BAD: Default export
export default function() { /* ... */ }
```

## Template Rules

```vue
<!-- GOOD: Unique key with v-for -->
<div v-for="item in items" :key="item.id">

<!-- BAD: Index as key -->
<div v-for="(item, index) in items" :key="index">

<!-- GOOD: v-if for conditional rendering -->
<div v-if="showContent">

<!-- GOOD: v-show for frequent toggles -->
<div v-show="isVisible">
```

## Anti-Patterns to Avoid

```typescript
// BAD: Options API
export default {
  data() { return { count: 0 } }
}

// BAD: Mutating props
props.title = 'new'

// BAD: reactive() for primitives
const count = reactive({ value: 0 })

// BAD: Destructuring reactive (loses reactivity)
const { x, y } = reactive({ x: 1, y: 2 })
```

## Reference

See `docs/guides/vue-standards.md` for comprehensive patterns and examples.
