---
name: vue-component
description: Generate Vue 3 component boilerplate. Auto-invoked when creating new Vue components.
---

# Vue Component Generator

Generate a Vue 3 component for `$ARGUMENTS`.

## Component Template

Create the component file with this structure:

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ============================================
// Props
// ============================================
interface Props {
  ${PROP_NAME}: ${PROP_TYPE}
  ${OPTIONAL_PROP}?: ${OPTIONAL_TYPE}
}

const props = withDefaults(defineProps<Props>(), {
  ${OPTIONAL_PROP}: ${DEFAULT_VALUE}
})

// ============================================
// Emits
// ============================================
const emit = defineEmits<{
  (e: '${EVENT_NAME}', value: ${EVENT_PAYLOAD_TYPE}): void
}>()

// ============================================
// Composables
// ============================================
// Import and use composables here
// const { data, loading } = useMyComposable()

// ============================================
// State
// ============================================
const ${STATE_NAME} = ref<${STATE_TYPE}>(${INITIAL_VALUE})

// ============================================
// Computed
// ============================================
const ${COMPUTED_NAME} = computed(() => {
  return ${COMPUTED_EXPRESSION}
})

// ============================================
// Watchers
// ============================================
watch(
  () => props.${WATCHED_PROP},
  (newValue, oldValue) => {
    // Handle prop change
  }
)

// ============================================
// Methods
// ============================================
function ${METHOD_NAME}(${PARAMS}: ${PARAM_TYPE}) {
  emit('${EVENT_NAME}', ${VALUE})
}

// ============================================
// Expose (if needed for parent access)
// ============================================
// defineExpose({
//   methodName,
//   publicRef
// })
</script>

<template>
  <div class="${COMPONENT_CLASS}">
    <!-- Component content -->
  </div>
</template>

<style scoped>
.${COMPONENT_CLASS} {
  /* Component styles */
}
</style>
```

## Minimal Component

For simple components:

```vue
<script setup lang="ts">
interface Props {
  title: string
}

const props = defineProps<Props>()
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
  </div>
</template>

<style scoped>
</style>
```

## Component with v-model

For components supporting v-model:

```vue
<script setup lang="ts">
interface Props {
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    :value="modelValue"
    @input="updateValue"
  />
</template>
```

## Component with Slots

For components with named slots:

```vue
<script setup lang="ts">
interface Props {
  title: string
}

const props = defineProps<Props>()

const slots = defineSlots<{
  default(): any
  header(): any
  footer(props: { count: number }): any
}>()
</script>

<template>
  <div>
    <header v-if="slots.header">
      <slot name="header" />
    </header>

    <h1>{{ title }}</h1>

    <main>
      <slot />
    </main>

    <footer v-if="slots.footer">
      <slot name="footer" :count="10" />
    </footer>
  </div>
</template>
```

## File Naming

- Use PascalCase: `UserCard.vue`, `ProjectList.vue`
- Suffix with purpose: `UserCardSkeleton.vue`, `ProjectListItem.vue`
- Views end with View: `DashboardView.vue`, `SettingsView.vue`

## Placement

| Type | Directory |
|------|-----------|
| Reusable components | `src/components/` |
| Page views | `src/views/` |
| Layout components | `src/layouts/` |
| Feature-specific | `src/components/{feature}/` |

## Checklist

- [ ] Uses `<script setup lang="ts">`
- [ ] Props defined with TypeScript interface
- [ ] Emits defined with TypeScript
- [ ] No Options API patterns
- [ ] Uses `ref()` not `reactive()` for state
- [ ] Computed used for derived values
- [ ] Proper `:key` on all `v-for`
- [ ] Scoped styles

## Reference

See `docs/guides/vue-standards.md` for comprehensive patterns.
