<template>
  <div class="qa-pa-md row items-start q-gutter-md" v-if="!editing && !processing">
    <item-selector-component :items="runnableQueries" @run-click="handleRunClick" />
  </div>

  <fab-action-component>
    <btn-component class="float-right" v-if="!processing && !isModified && !editing" icon="replay"
      @click="handleGatherAllClick" />
  </fab-action-component>

  <proc-manager-component @processing-complete="handleProcComplete" v-if="processing" />
</template>
<script>
import { ref, reactive, toRefs, onMounted, inject } from "vue";
import { storeToRefs } from 'pinia'
import { useLoadingStore } from "@/stores/loading.store";
import { useProjectDetailsStore } from "@/stores/project-details.store";
import ItemSelectorComponent from "@/components/ItemSelectorComponent.vue";
import BtnComponent from "@/components/BtnComponent.vue";
import ProcManagerComponent from "@/components/ProcManagerComponent.vue";
import FabActionComponent from "@/components/FabActionComponent.vue";

export default {
  name: "QueryManagerView",
  components: {
    ItemSelectorComponent,
    BtnComponent,
    FabActionComponent,
    ProcManagerComponent,
  },
  setup() {
    const navService = inject("navService");
    const cmdService = inject("cmdService");

    const loadingStore = useLoadingStore();
    const { loading } = storeToRefs(loadingStore);

    const store = useProjectDetailsStore();
    const { runnableQueries } = storeToRefs(store);

    const processing = ref(false);

    const data = reactive({
      loading,
      runnableQueries,
      processing,
    });

    const handleGatherAllClick = async (e) => {
      if (!e) return;

      processing.value = true;

      const cmds = runnableQueries.value.map((i) => ({
        projectId: navService.projId,
        ql: i.data.ql,
      }))
      await runQueries(cmds);
    };

    const handleRunClick = async (e) => {
      if (!e) return;

      processing.value = true;

      const cmds = [{
        projectId: navService.projId,
        ql: e.item.data.ql,
      }];

      await runQueries(cmds);
    };

    async function runQueries(cmds) {
      await Promise.all(cmds.map((i) => cmdService.publishGatherCmd(i)));
    }

    const handleProcComplete = () => {
      processing.value = false;
    };

    const initState = () => { };

    onMounted(() => {
      initState();
    });

    return {
      ...toRefs(data),
      handleGatherAllClick,
      handleRunClick,
      handleProcComplete
    };
  },
};
</script>
<style>
.float-right {
  float: right;
  margin-bottom: 5px;
}
</style>