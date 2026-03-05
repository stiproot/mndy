<template>
  <div class="container">
    <div class="content" v-if="!processing">
      <initiative-component :value="initiativeModel" v-if="showInitiative" @updated="handleInitiativeUpdated" />

      <btn-component class="float-right" v-if="showInitiative" icon="close" @click="handleCloseClick" />

      <q-form class="q-gutter-lg q-px-md" v-if="!showInitiative && !isExpanded">
        <q-input v-model="dashboardName" label="Dashboard Name *" lazy-rules
          :rules="[(val) => (val && val.length) || 'Dashboard name is required']" />

        <search-teams-component :init-val="teamName" @selected="handleTeamSelect" />
        <search-iterations-component :init-val="iterationPath" :team-name="teamName" @selected="handleIterationSelect" />

        <q-input v-model="queryFolderBasePath" label="Query folder base path *" lazy-rules
          :rules="[(val) => (val && val.length) || 'Query folder base path is required',]" />

        <q-btn v-if="!showInitiative" icon="add" @click="handleAddClick" color="white" text-color="black"
          label="Add Initiative" />

        <item-selector-component :items="enrichedInitiatives"
          @remove-click="handleRemoveInitiativeClick"></item-selector-component>
      </q-form>

      <q-expansion-item v-if="!showInitiative && !processing" expand-separator v-model="isExpanded" icon="style"
        label="Quick">
        <q-expansion-item-content>
          <q-input v-model="createPayload" label="Tags" lazy-rules type="textarea" @blur="handlePayloadBlur" :rows="10"
            :rules="[(val) => (val && val.length) || 'Required']" />
        </q-expansion-item-content>
      </q-expansion-item>
      
      <br />

      <div class="button-container q-pa-sm">
        <q-btn unelevated color="accent" class="apply-button" padding="sm lg" label="Create" :disable="!canCreate && !processing && !showInitiative" @click="handleCreateClick" />
      </div>
    </div>
  </div>

  <proc-manager-component @processing-complete="handleProcComplete" v-if="processing" />
</template>
<script>
import { computed, reactive, toRefs, ref, inject } from "vue";
import { storeToRefs } from 'pinia'
import { CmdTypes } from "@/types/cmd-types";
import { useCreateAzdoDashboardStore } from "@/stores/create-azdo-dashboard.store";
import BtnComponent from "@/components/BtnComponent.vue";
import ProcManagerComponent from "@/components/ProcManagerComponent.vue";
import SearchTeamsComponent from "@/components/azdo/SearchTeamsComponent.vue";
import SearchIterationsComponent from "@/components/azdo/SearchIterationsComponent.vue";
import InitiativeComponent from "@/components/InitiativeComponent.vue";
import ItemSelectorComponent from "@/components/ItemSelectorComponent.vue";
export default {
  name: "AzdoDashboardView",
  components: {
    BtnComponent,
    ProcManagerComponent,
    InitiativeComponent,
    SearchTeamsComponent,
    SearchIterationsComponent,
    ItemSelectorComponent,
  },
  setup() {
    const cmdService = inject("cmdService");
    const store = useCreateAzdoDashboardStore();
    const {
      dashboardName,
      iterationPath,
      teamName,
      queryFolderBasePath,
      initiatives,
      enrichedInitiatives,
      isValidState,
    } = storeToRefs(store);
    const {
      addInitiative,
      removeInitiative,
      init,
    } = store;

    const createPayload = ref("");
    const processing = ref(false);
    const isExpanded = ref(false);
    const showInitiative = ref(false);
    const searchingIterations = ref(false);

    const defaultInitiativeState = (title = null, tag = null, desc = null) => ({
      title: title || "",
      tag: tag || "",
      desc: desc || "",
    });

    const canCreate = computed(() => isValidState);

    const data = reactive({
      dashboardName,
      iterationPath,
      teamName,
      queryFolderBasePath,
      initiatives,
      enrichedInitiatives,
      createPayload,
      processing,
      canCreate,
      searchingIterations,
    });

    const initiativeModel = ref(defaultInitiativeState());

    const resetInitiativeModel = () => initiativeModel.value = defaultInitiativeState();

    const handleAddClick = () => {
      resetInitiativeModel();
      showInitiative.value = true;
    };

    const handleCloseClick = () => {
      resetInitiativeModel();
      showInitiative.value = false;
    };

    const handlePayloadBlur = () => {
      if (!createPayload.value) return;

      let tags = createPayload.value.split(";");
      if (!tags.length || tags.length === 1) tags = createPayload.value.split("\n");
      if (!tags.length || tags.lenth === 1) tags = createPayload.value.split(" ");
      if (!tags.length) return;

      const newInitiatives = tags.map(t => t.trim()).filter(t => t !== "").map(t => defaultInitiativeState(t, t, t));
      initiatives.value = newInitiatives;
      createPayload.value = "";
      isExpanded.value = false;
    };

    const handleTeamSelect = (e) => {
      if (!e || e === "") return;

      teamName.value = e;
    };

    const handleIterationSelect = (e) => {
      if (!e || e === "") return;
      iterationPath.value = e;
    };

    const mergeInitiatives = (val) => {
      const existing = initiatives.value.find((i) => i.tag === val.tag);

      if (existing) {
        existing.title = val.title;
        existing.desc = val.desc;
        existing.queryFolderName = val.queryFolderName;
        removeInitiative(existing);
        addInitiative(existing);
        return;
      }

      initiatives.value.push(val);
    };

    const handleInitiativeUpdated = (val) => {
      mergeInitiatives(val);
      resetInitiativeModel();
      showInitiative.value = false;
    };

    const handleRemoveInitiativeClick = (e) => {
      removeInitiative(e.item.data);
    };

    const handleCreateClick = async (e) => {
      if (!e) return;

      const cmd = {
        cmdType: CmdTypes.CREATE_DASHBOARD,
        cmdData: {
          cmd: {
            dashboardName: dashboardName.value,
            iterationPath: iterationPath.value,
            teamName: teamName.value,
            queryFolderBasePath: queryFolderBasePath.value,
            initiatives: initiatives.value
          }
        },
      };

      await cmdService.publishAzdoProxyCmd({ reqs: [cmd] });

      processing.value = true;
    }

    const handleProcComplete = () => {
      createPayload.value = "";
      processing.value = false;
      init();
    };

    return {
      ...toRefs(data),
      initiativeModel,
      showInitiative,
      isExpanded,
      handleCreateClick,
      handleRemoveInitiativeClick,
      handleAddClick,
      handleCloseClick,
      handleInitiativeUpdated,
      handlePayloadBlur,
      handleTeamSelect,
      handleIterationSelect,
      handleProcComplete
    };
  },
};
</script>
<style scoped>
.container {
  padding: 16px 16px 16px 0; /* Adjust as needed */
}

.content {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 16px;
  padding: 16px; /* Adjust as needed */
}

.float-right {
  float: right;
}

.float-left {
  float: left;
}

.button-container {
  display: flex;
  justify-content: flex-end;
}

.card-width {
  max-width: 400px;
}
</style>