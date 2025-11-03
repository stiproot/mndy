<template>
  <q-layout container style="min-height: 600px; max-height: 100vh" view="Lhh lpR fff Rt">
      <q-drawer v-model="rightDrawerOpen" :width="350" show-if-above bordered side="right">
        <list-component />
      </q-drawer>

      <div class="flex justify-start">
        <q-btn flat dense round @click="handleMenuToggleClick" aria-label="" icon="menu">
          <q-tooltip>
            {{ rightDrawerOpen ? 'Close panel' : 'Open panel' }}
          </q-tooltip>
        </q-btn>
      </div>

      <q-expansion-item dense v-model="isExpanded" expand-separator label="Filters" caption="">
        <q-card bordered>
          <filter-controls-component @filter="handleFilter" />
        </q-card>
      </q-expansion-item>

      <br />

      <div>
        <div v-if="avgVal">
          <span>Selected Average: </span>
          <q-badge rounded :color="avgColor">
            {{ avgVal }}
          </q-badge>
        </div>
        <div v-if="projAvgVal">
          <span>Project Average: </span>
          <q-badge rounded :color="projAvgColor">
            {{ projAvgVal }}
          </q-badge>
        </div>
      </div>
      <div class="flex flex-top">
        <div id="tooltip" class="tooltip"></div>
        <div ref="chartContainer"></div>
      </div>
      <q-inner-loading :showing="isLoading">
        <q-spinner color="primary" size="50px" />
      </q-inner-loading>
  </q-layout>
</template>

<script>
import { toRefs, ref, reactive, onMounted, watch, inject } from "vue";
import { useUnitsStore } from "@/stores/units.store";
import { buildGrid } from "@/builders/charts.manager";
import FilterControlsComponent from "../FilterControlsComponent.vue";
import ListComponent from "../ListComponent.vue";
import { getBadgeColor, getRiskText } from "@/services/color.service";
import { storeToRefs } from 'pinia'

export default {
  name: "NestedTreeMapComponent",
  components: { FilterControlsComponent, ListComponent },
  setup() {
    const navService = inject("navService");
    const store = useUnitsStore();
    const { tasks, isInitialized } = storeToRefs(store);
    const { init } = store;

    const chartContainer = ref(null);

    const rightDrawerOpen = ref(false);
    const originalDataset = ref([]);
    const dataset = ref([]);
    const accumPred = ref(() => true);
    const isExpanded = ref(false);

    const avgColor = ref(null);
    const avgVal = ref(null);
    const avgText = ref(null);
    const projAvgColor = ref(null);
    const projAvgVal = ref(null);

    const isLoading = ref(true);

    const data = reactive({
      isExpanded,
      tasks,
      isInitialized,
      rightDrawerOpen,
      chartContainer,
      avgColor,
      avgVal,
      avgText,
      projAvgColor,
      projAvgVal,
      isLoading,
    });

    const handleMenuToggleClick = () => rightDrawerOpen.value = !rightDrawerOpen.value;

    const handleFilter = (e) => {
      if (!e) return;
      if (!isExpanded.value) return;

      const { severities, rags, risk_impact_range, tagFilter, defaulted } = e;

      const ragPred = (node) => rags.includes(node.rag_status);
      const riskImpactPred = (node) => node.risk_impact >= risk_impact_range.min && node.risk_impact <= risk_impact_range.max;
      const severityPred = (node) => severities.map((s) => s.value).includes(node.severity);
      const isDefaultedPred = (node) => defaulted === true ? node.defaulted === true : true;
      const tagsPred = (node) => {
        if (tagFilter.or) node.tags.filter((t) => tagFilter.tags.includes(t)).length > 0;

        let accum = tagFilter.or;
        node.tags.forEach((t) => {
          accum = accum && tagFilter.tags.includes(t);
        });
        return accum;
      };

      const accum = (node) => tagsPred(node) && riskImpactPred(node) && severityPred(node) && ragPred(node) && isDefaultedPred(node);

      accumPred.value = accum;
    };

    const updateProjAvg = () => {
      if (!originalDataset.value && originalDataset.value.length === 0) return;

      let total = 0;
      for (const task of tasks.value) total += task.risk_impact;

      const avg = total / tasks.value.length;
      projAvgColor.value = getBadgeColor(avg);
      projAvgVal.value = `${avg.toFixed(2)} / 50.00 (${getRiskText(avg)})`;
    };

    const updateAvg = () => {
      if (dataset.value.length === 0) return;

      let total = 0;
      for (const task of tasks.value) total += task.risk_impact;

      const avg = total / tasks.value.length;
      avgColor.value = getBadgeColor(avg);
      avgVal.value = `${avg.toFixed(2)} / 50.00 (${getRiskText(avg)})`;
    };

    const refreshDataset = () => {
      originalDataset.value = tasks.value;

      if (!tasks.value) {
        console.warn("Refreshing data set", "no data");
        dataset.value = [];
        return;
      }

      dataset.value = tasks.value.filter((t) => accumPred.value(t));
    };

    const removeSvgs = () => {
      const container = chartContainer.value;
      if (!container || !container.childNodes.length) return;

      for (const childNode of Array.from(container.childNodes)) {
        if (childNode.tagName === "svg" || childNode.tagName === "SVG") container.removeChild(childNode);
      }
    };

    // const renderChartInChunks = (data, chunkSize = 100) => {
    //   removeSvgs();

    //   if (!data) {
    //     console.warn("Cannot render chart", "no data");
    //     return;
    //   }

    //   const container = chartContainer.value;
    //   let index = 0;

    //   const renderChunk = () => {
    //     const chunk = data.slice(index, index + chunkSize);
    //     const svg = buildGrid(chunk);
    //     container.appendChild(svg);
    //     index += chunkSize;

    //     if (index < data.length) {
    //       requestAnimationFrame(renderChunk);
    //     }
    //   };

    //   renderChunk();
    // };

    const renderChart = () => {
      removeSvgs();

      if (!dataset.value) {
        console.warn("Cannot render chart", "no data");
        return;
      }

      const svg = buildGrid(dataset.value);
      const container = chartContainer.value;

      container.appendChild(svg);
    };


    watch(
      () => originalDataset.value,
      () => {
        isLoading.value = true;
        updateProjAvg();
        isLoading.value = false;
      }
    );

    watch(
      () => accumPred.value,
      () => {
        isLoading.value = true;
        refreshDataset();
        isLoading.value = false;
      }
    );

    watch(
      () => dataset.value,
      () => {
        isLoading.value = true;
        renderChart();
        updateAvg();
        isLoading.value = false; // Set loading to false after rendering the chart
      }
    );

    const initState = () => refreshDataset();

    onMounted(async () => {
      isLoading.value = true;
      await init(navService.projId);
      initState();
      isLoading.value = false; // Set loading to false after initialization
    });

    return { ...toRefs(data), handleFilter, handleMenuToggleClick };
  },
};
</script>

<style scoped>
.larger-font {
  font-size: larger;
}

.chart-container {
  width: 100%;
  overflow: auto;
}

.q-expansion-item {
  border: 1px solid #ccc;
  border-radius: 5px;
}

.tooltip {
  position: fixed;
  display: none;
  padding: 10px;
  background-color: white;
  border: 1px solid black;
}
</style>
