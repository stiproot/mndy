<template>
  <div class="q-pa-md q-gutter-sm">
    <q-tree node-key="label" default-expand-all :nodes="enrichedTree" />
  </div>
  <slot />
</template>
<script>
import { computed } from "vue";

export default {
  name: "TreeComponent",
  props: {
    data: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const enrich = (data) => {
      const enriched = data.map((node) => {
        const enrichedNode = {
          ...node,
          label: node.id ? `${node.id} - ${node.type} - ${node.title}` : `${node.type} - ${node.title}`,
          children: node.children ? enrich(node.children) : [],
        };

        return enrichedNode;
      });

      return enriched;
    };

    const enrichedTree = computed(() => enrich(props.data));

    return {
      enrichedTree,
    };
  },
};
</script>
<style></style>
