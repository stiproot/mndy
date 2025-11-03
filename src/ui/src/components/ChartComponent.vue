<template >
  <div class='main-container'>
    <q-expansion-item dense v-if="chartFiltersSupported" style="align-self: stretch;" v-model="isExpanded" expand-separator label="Filters" caption="">
      <q-card bordered>
        <filter-controls-component @filter="handleFilter" />
      </q-card>
    </q-expansion-item>

    <div v-if="loading" class="loading-spinner">
      <q-spinner size="50px" color="primary" />
    </div>
    <div class="q-mt-md chart-container" ref="chartContainer"/>
  </div>
</template>

<script>
import { toRefs, ref, reactive, onMounted, watch, inject } from "vue";
import { useStructuresStore } from "@/stores/structures.store";
import { CHARTS_SUPPORTING_FILTERS, getChartSvgBuilder } from "@/services/charts.service";
import FilterControlsComponent from "./FilterControlsComponent.vue";
import { filterTree, getTasks } from "@/fns/tree.fns";
import { getBadgeColor, getRiskText } from "@/services/color.service";
import { storeToRefs } from 'pinia'

export default {
  name: "ChartComponent",
  components: { FilterControlsComponent },
  props: {
    chartId: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const navService = inject("navService");
    const store = useStructuresStore();
    const { tree, isInitialized } = storeToRefs(store);
    const { init } = store;

    const chartContainer = ref(null);
    const chartFiltersSupported = ref(false);
    const loading = ref(true);

    const rightDrawerOpen = ref(false);
    const originalDataset = ref([]);
    const dataset = ref([]);
    const accumFilterFn = ref(null);
    const isExpanded = ref(false);

    const avgColor = ref(null);
    const avgVal = ref(null);
    const avgText = ref(null);
    const projAvgColor = ref(null);
    const projAvgVal = ref(null);

    const data = reactive({
      isExpanded,
      tree,
      isInitialized,
      chartFiltersSupported,
      rightDrawerOpen,
      chartContainer,
      avgColor,
      avgVal,
      avgText,
      projAvgColor,
      projAvgVal,
      loading
    });

    const handleMenuToggleClick = () => {
      rightDrawerOpen.value = !rightDrawerOpen.value;
    };

    const handleFilter = (e) => {
      if (!e) return;
      if (!isExpanded.value) return;
      const { severities, rags, risk_impact_range, tagFilter, defaulted } = e;
      const ragFn = (node) => rags.includes(node.rag_status);
      const riskImpactFn = (node) =>
        node.risk_impact >= risk_impact_range.min &&
        node.risk_impact <= risk_impact_range.max;
      const severityVals = severities.map((s) => s.value);
      const severityFn = (node) => severityVals.includes(node.severity);
      const defaultedFn = (node) => {
        return defaulted === true ? node.defaulted === true : true;
      };

      const tagsFn = (node) => {
        if (tagFilter.or) {
          const filtered = node.tags.filter((t) => tagFilter.tags.includes(t));
          return filtered.length > 0;
        }

        let accum = tagFilter.or;
        node.tags.forEach((t) => {
          accum = accum && tagFilter.tags.includes(t);
        });
        return accum;
      };

      const fn = (node) => {
        return (
          tagsFn(node) &&
          riskImpactFn(node) &&
          severityFn(node) &&
          ragFn(node) &&
          defaultedFn(node)
        );
      };

      accumFilterFn.value = fn;
    };

    const updateProjAvg = () => {
      if (originalDataset.value.length === 0) return;

      const tasks = [];
      let total = 0;

      getTasks(originalDataset.value, tasks);

      for (const task of tasks) total += task.risk_impact;

      const avg = total / tasks.length;

      projAvgColor.value = getBadgeColor(avg);
      projAvgVal.value = `${avg.toFixed(2)} / 50.00 (${getRiskText(avg)})`;
    };

    const updateAvg = () => {
      if (dataset.value.length === 0) return;

      const tasks = [];
      let total = 0;

      getTasks(dataset.value, tasks);

      for (const task of tasks) total += task.risk_impact;

      const avg = total / tasks.length;

      avgColor.value = getBadgeColor(avg);
      avgVal.value = `${avg.toFixed(2)} / 50.00 (${getRiskText(avg)})`;
    };

    const refreshDataset = () => {
      const data = tree.value;
      originalDataset.value = data;

      if (!data) {
        console.warn("refreshDataset", "no data");
        dataset.value = [];
        return;
      }

      const filterFns = accumFilterFn.value ? [accumFilterFn.value] : [];
      const filtered = filterTree(data, filterFns);

      dataset.value = filtered;
    };

    const renderChart = () => {
      removeSvgs();

      if (!dataset.value) {
        console.warn("renderChart", "no data");
        return;
      }

      const chartType = props.chartId;
      const svgBuilder = getChartSvgBuilder(chartType);
      if (typeof svgBuilder !== 'function') {
        console.error(`No SVG builder function found for chart type: ${chartType}`);
        return;
      }
      const svg = svgBuilder(dataset.value);

      const container = chartContainer.value;

      container.appendChild(svg);
      loading.value = false;

    };

    const removeSvgs = () => {
      const container = chartContainer.value;
      if (container && container.childNodes.length > 0) {
        for (const childNode of Array.from(container.childNodes)) {
          if (childNode.tagName === "svg" || childNode.tagName === "SVG") {
            container.removeChild(childNode);
          }
        }
      }
    };

    const initState = () => {
      chartFiltersSupported.value = CHARTS_SUPPORTING_FILTERS.includes(props.chartId);
    };

    watch(
      () => tree.value,
      () => {
        refreshDataset();
      }
    );

    watch(
      () => accumFilterFn.value,
      () => {
        refreshDataset();
      }
    );

    watch(
      () => dataset.value,
      () => {
        renderChart();
        updateAvg();
      }
    );

    watch(
      () => originalDataset.value,
      () => {
        updateProjAvg();
      }
    );

    onMounted(async () => {
      await init(navService.projId);
      initState();
    });

    return { ...toRefs(data), handleFilter, handleMenuToggleClick };
  },
};
</script>

<style scoped>
.main-container{
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: auto;
  width: 100%;
  /* height: 90vh; */
}

.larger-font {
  font-size: larger;
}

.chart-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  border: 3px solid #eef1f4;
  border-radius: 8px;
}

.q-expansion-item {
  border: 1px solid #ccc;
  border-radius: 5px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>