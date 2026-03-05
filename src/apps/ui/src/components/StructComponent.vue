<template>
  <tree-component :data="tree" />
  <slot />
</template>
<script>
import { computed } from "vue";
import { useStructureStagingStore } from "@/stores/structure-staging.store";
import TreeComponent from "@/components/TreeComponent.vue";
import { storeToRefs } from 'pinia'

export default {
  name: "StructComponent",
  components: {
    TreeComponent,
  },
  setup() {
    const store = useStructureStagingStore();
    const { staged } = storeToRefs(store);
    const tree = computed(() => staged.value.structure.children);

    return {
      tree,
    };
  },
};
</script>
<style></style>
