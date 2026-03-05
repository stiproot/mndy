<template>
  <div>
    <q-splitter v-model="splitterModel">
      <template v-slot:before v-if="!hideTabs">
        <q-tabs v-model="tab" vertical class="text-teal">
          <q-tab name="charts" icon="bar_chart" label="" />
          <q-tab name="structures" icon="category" label="" />
        </q-tabs>
      </template>

      <template v-slot:after>
        <q-tab-panels
          v-model="tab"
          animated
          swipeable
          vertical
          transition-prev="jump-up"
          transition-next="jump-up"
        >
          <q-tab-panel name="charts">
            <div v-if="!fullscreen" class="text-h4 q-mb-md">Charts</div>
            <ChartManagerView />
          </q-tab-panel>

          <q-tab-panel name="structures">
            <div class="text-h4 q-mb-md">Structures</div>
            <StructManagerView />
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
  </div>
</template>
<script>
import { watch, onMounted, ref, inject } from "vue";
import { useStructuresStore } from "@/stores/structures.store";
import { useLayoutStore } from "@/stores/layout.store";
import ChartManagerView from "./ChartManagerView.vue";
import StructManagerView from "./StructManagerView.vue";
import { storeToRefs } from 'pinia'
export default {
  name: "VisManagerView",
  components: {
    ChartManagerView,
    StructManagerView,
  },
  props: {
    tabId: {
      type: String,
      default: () => "charts",
    },
  },
  setup(props) {
    const navService = inject("navService");
    const layoutStore = useLayoutStore();
    const { maximized, fullscreen } = storeToRefs(layoutStore);

    const structuresStore = useStructuresStore();
    const { init } = structuresStore;

    const tab = ref(props.tabId);
    watch(
      () => tab.value,
      (val) => {
        navService.replace({ query: { tab: val } });
      }
    );

    const hideTabs = ref(false);
    watch(
      () => maximized.value,
      () => {
        hideTabs.value = maximized.value && tab.value === "charts";
      }
    );

    watch(
      () => fullscreen.value,
      () => {
        hideTabs.value = fullscreen.value ? true : maximized.value && tab.value === "charts";
      }
    );

    onMounted(async () => {
      await init(navService.projId);
    });

    return {
      tab,
      hideTabs,
      fullscreen
    };
  },
};
</script>
<style>
.float-right {
  float: right;
}
</style>
