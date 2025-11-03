<template>
  <q-card v-if="!fullscreen" flat bordered>
    <q-card-section horizontal>
      <q-item>
        <q-item-section avatar>
          <q-avatar>
            <q-icon size="32px" :style="{ color: color }" name="interests" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-h6">{{ name }}</q-item-label>
          <q-item-label caption>
            {{ owner }}
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-separator vertical />
      <q-card-section>Tags: {{ tag }}</q-card-section>
    </q-card-section>
  </q-card>
  <br />
  <q-tabs
    v-if="!fullscreen"
    v-model="tab"
    dense
    class="text-grey"
    active-color="primary"
    indicator-color="primary"
    align="justify"
  >
    <q-tab name="vis" label="Visuals" @click="handleTabClick" />
    <q-tab name="definition" label="Definition" @click="handleTabClick" />
  </q-tabs>

  <br v-if="!fullscreen" />

  <router-view></router-view>
</template>
<script>
import { ref, onMounted, toRefs, reactive, inject, watch } from "vue";
import { storeToRefs } from 'pinia'
import { useProjectDetailsStore } from "@/stores/project-details.store";
import { useLayoutStore } from "@/stores/layout.store";
export default {
  name: "ProjRootView",
  setup() {
    const navService = inject("navService");
    const projectStore = useProjectDetailsStore();
    const layoutStore = useLayoutStore();

    const { id, name, tag, queries, color, isStateValid } =
      storeToRefs(projectStore);
    const { init } = projectStore;
    const { fullscreen } = storeToRefs(layoutStore);

    const data = reactive({
      id,
      name,
      tag,
      queries,
      color,
      isStateValid,
      fullscreen
    });

    const tab = ref(navService.projectDimension());

    const handleTabClick = () => {
      if (tab.value === "vis") {
        navService.goToVis(navService.projId);
      }
      if (tab.value === "definition") {
        navService.goToProjDefinition(navService.projId);
      }
    };

    watch(() => navService.projId, async () => await init(navService.projId));

    onMounted(async () => await init(navService.projId));

    return {
      tab,
      handleTabClick,
      ...toRefs(data),
    };
  },
};
</script>
<style scoped>
.card-width {
  max-width: 250px;
}
</style>
