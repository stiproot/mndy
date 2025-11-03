<template>
  <item-selector-component v-if="!showChart" :items="charts" @item-click="handleChartClick" />

  <router-view></router-view>

  <fab-action-component style="z-index: 3001">
    <btn-component style="background-color: white" :icon="fullscreen ? 'fullscreen_exit' : 'fullscreen'"
      color="secondary" v-if="showChart" @click="handleFullscreenClick" />
    <btn-component style="background-color: white" icon="close" color="secondary" v-if="showChart"
      @click="handleCloseClick" />
  </fab-action-component>
</template>
<script>
import { ref, computed, onMounted, inject } from "vue";
import { storeToRefs } from "pinia";
import { useLayoutStore } from "@/stores/layout.store";
import ItemSelectorComponent from "@/components/ItemSelectorComponent.vue";
import FabActionComponent from "@/components/FabActionComponent.vue";
import BtnComponent from "@/components/BtnComponent.vue";
import {
  CHART_TYPES_LIST,
  CHART_TYPE_RGB_COLOR_HASH,
} from "@/services/charts.service";

export default {
  name: "ChartManagerView",
  components: {
    ItemSelectorComponent,
    FabActionComponent,
    BtnComponent,
  },
  setup() {
    const navService = inject("navService");
    const layoutStore = useLayoutStore();
    const { fullscreen } = storeToRefs(layoutStore);

    const enrichData = (data) => {
      return data.map((c) => {
        const item = {
          title: c.description,
          color: CHART_TYPE_RGB_COLOR_HASH[c.id],
          actions: [
            {
              evtId: "item-click",
              btnIcon: "visibility",
            },
          ],
          data: c,
        };
        if (c.in_progress) {
          item.headerIcons = [{
            icon: c.in_progress ? "construction" : null
          }];
        }
        return item;
      });
    };

    const data = enrichData(CHART_TYPES_LIST);
    const charts = ref(data);
    const chartType = ref(null);
    const showChart = computed(() => navService.chartId !== undefined || navService.treeId !== undefined || navService.gridId !== undefined);

    const handleChartClick = (e) => {
      if (e.item.data.id === "nested-treemap") {
        navService.goToGrid(navService.projId, "nested-treemap");
        return;
      }

      if (e.item.data.id === "expandable-tree") {
        navService.goToTree(navService.projId, "expandable");
        return;
      }

      navService.goToChart(navService.projId, e.item.data.id);
    };

    function handleCloseClick(e) {
      if (!e) return;
      fullscreen.value = false;
      navService.goToVis(navService.projId);
      chartType.value = null;
    }

    function handleFullscreenClick(e) {
      if (!e) return;
      fullscreen.value = !fullscreen.value;
    }

    onMounted(() => {
      console.info(
        "chartManager",
        "onMounted",
        `projId: ${navService.projId}`,
        `chartId: ${navService.chartId}`
      );
    });

    return {
      charts,
      handleChartClick,
      handleCloseClick,
      handleFullscreenClick,
      showChart,
      chartType,
      fullscreen
    };
  },
};
</script>
<style scoped>
.card-width {
  max-width: 250px;
}
</style>
