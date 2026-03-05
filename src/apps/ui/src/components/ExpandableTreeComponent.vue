<template>
  <div v-if="loading" class="loading-spinner">
    <q-spinner size="50px" color="primary" />
  </div>
  <div id="tree" class="chart-container"></div>
</template>
<script>
import { onMounted, watch, ref, computed, inject } from "vue";
import { Treeviz } from "../expandable-tree";
import { useStructuresStore } from "@/stores/structures.store";
import { buildCard } from "@/builders/expandable-tree.builder";

export default {
  name: "ExpandableTreeComponent",
  props: {
    data: {
      type: Array,
      required: true,
    },
    chartId: {
      type: String,
      required: true
    }
  },
  setup() {
    const navService = inject("navService");
    const store = useStructuresStore();
    const { init, rootNode } = store;
    let tree = null;
    const treeHash = ref({});
    const treeSet = computed(() => Object.values(treeHash.value));
    const loading = ref(true);

    function initTree() {
      tree = Treeviz.create({
        data: treeSet.value,
        htmlId: "tree",
        idKey: "id",
        hasFlatData: true,
        relationnalField: "parent_id",
        hasPan: true,
        hasZoom: true,
        nodeHeight: 300,
        nodeWidth: 375,
        mainAxisNodeSpacing: 1.5,
        isHorizontal: false,
        duration: 175,
        renderNode: function renderNode(node) {
          return buildCard(node.data);
        },
        linkWidth: () => {
          return 2;
        },
        linkShape: "curve",
        linkColor: () => `#B0BEC5`,
        onNodeClick: (node) => {
          const attrs = Array.from(node?._?.srcElement?.attributes || []).filter((a) => a.name === "data-type" && a.value === "link");
          if (attrs.length) {
            window.open(node.data.ext_url, "_blank");
            return;
          }
          handleExpandNodeClick(node);
        },
      });
    }

    async function initState() {
      await init(navService.projId);

      const root = rootNode();
      treeHash.value[root.id] = root;

      for (const c of root.children) {
        treeHash.value[c.id] = c;
      }

      initTree();
      refreshTree();
      loading.value = false;
    }

    function handleExpandNodeClick(node) {

      for (const c of node.data.children) {
        if (c.id in treeHash.value === false) {
          treeHash.value[c.id] = c;
        }
        else {
          delete treeHash.value[c.id];
        }

        refreshTree();
      }
    }

    function refreshTree() {
      if (tree === null) return;
      tree.refresh(treeSet.value);
    }

    watch(
      () => treeSet.value,
      () => {
        refreshTree();
      }
    );

    onMounted(async () => {
      await initState();
    });

    return {};
  },
};
</script>
<style scoped>
.chart-container {
  width: 100%;
  min-height: 50vh;
  min-width: 1000px; /* Ensure the container has a minimum width */
  overflow: scroll;
  border: 3px solid #eef1f4;
  border-radius: 8px;
}
</style>