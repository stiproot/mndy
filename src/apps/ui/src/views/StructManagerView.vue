<template>
  <div v-if="!editing && !processing" class="qa-pa-md row items-start q-gutter-md">
    <item-selector-component :items="enriched" @item-click="handleItemClick" @refresh-click="handleRefreshClick" />
  </div>

  <struct-component v-if="editing && !processing" />

  <proc-manager-component @processing-complete="handleProcComplete" v-if="processing" />

  <fab-action-component>
    <btn-component v-if="editing && enriched.length && !processing" @click="handleCloseClick" />
  </fab-action-component>
</template>

<script>
import { onMounted, ref, reactive, toRefs, inject } from "vue";
import { useLoadingStore } from "@/stores/loading.store";
import { useStructureStagingStore } from "@/stores/structure-staging.store";
import { useStructuresStore } from "@/stores/structures.store";
import ItemSelectorComponent from "@/components/ItemSelectorComponent.vue";
import FabActionComponent from "@/components/FabActionComponent.vue";
import BtnComponent from "@/components/BtnComponent.vue";
import StructComponent from "@/components/StructComponent.vue";
import ProcManagerComponent from "@/components/ProcManagerComponent.vue";
import { storeToRefs } from 'pinia'

export default {
  name: "StructManagerView",
  components: {
    ItemSelectorComponent,
    FabActionComponent,
    BtnComponent,
    StructComponent,
    ProcManagerComponent,
  },
  setup() {
    const navService = inject("navService");
    const loadingStore = useLoadingStore();
    const { loading } = storeToRefs(loadingStore);
    const structuresStore = useStructuresStore();
    const { enrichedStructures, structures } = storeToRefs(structuresStore);
    const { init: initStructures } = structuresStore;
    const structureStagingStore = useStructureStagingStore();
    const { init: initStructureStaging } = structureStagingStore;

    const editing = ref(false);
    const processing = ref(false);

    const data = reactive({
      loading,
      structures,
      enriched: enrichedStructures,
      processing,
      editing,
    });

    const handleItemClick = (e) => {
      editing.value = true;
      const item = enrichedStructures.value.find((i) => i.data.id === e.item.data.id);
      initStructureStaging(item.data);
    };

    const handleCloseClick = (e) => {
      if (!e) return;

      initStructureStaging();
      editing.value = false;
    };

    onMounted(async () => {
      await initStructures(navService.projId);
    });

    return {
      ...toRefs(data),
      handleItemClick,
      handleCloseClick,
    };
  },
};
</script>
<style></style>