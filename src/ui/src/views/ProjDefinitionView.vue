<template>
  <q-page>
    <q-splitter v-model="splitterModel">
      <template v-slot:before>
        <q-tabs v-model="tab" vertical class="text-teal">
          <q-tab name="actions" icon="rule" label="" />
          <q-tab name="info" icon="info" label="" />
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
          <q-tab-panel name="actions">
            <div class="text-h4 q-mb-md">Actions</div>
            <ActionsManagerView />
          </q-tab-panel>

          <q-tab-panel name="info">
            <div class="text-h4 q-mb-md">Info</div>
            <ProjDetailsView />
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted, inject, defineProps } from "vue";
import { useProjectDetailsStore } from "@/stores/project-details.store";
import ProjDetailsView from "./ProjDetailsView.vue";
import ActionsManagerView from "./ActionsManagerView.vue";
import { defineComponent } from 'vue';

defineComponent({
  name: 'ProjDefinitionView',
});

// Define props
const props = defineProps({
  tabId: {
    type: String,
    default: "actions",
  },
});

// Inject services
const navService = inject("navService");

// Use store
const store = useProjectDetailsStore();
const { init } = store;

// Define reactive state
const tab = ref(props.tabId);
const splitterModel = ref(true); // Assuming you have a splitter model

// Watch for tab changes
watch(
  () => tab.value,
  (val) => {
    navService.replace({ query: { tab: val } });
  }
);

// Fetch project details on component mount
onMounted(async () => {
  await init(navService.projId);
});
</script>

<style></style>
