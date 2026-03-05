<template>
  <div class="container">
    <div class="content">
      <div class="q-pa-md q-gutter-sm">
        <q-btn outline rounded color="primary" @click="handleCyberdyneClick" label="Cyberdyne's MDLC" />
        <q-btn outline rounded color="primary" @click="handleGenisysClick" label="Genisys' MDLC" />
        <q-btn outline rounded color="primary" @click="handleChapmansPeakClick" label="Chapmans Peak SDLC" />
      </div>

      <div v-if="!processing" class="q-pa-md">

        <q-expansion-item v-model="showEnrichment" expand-separator bordered label="Enrichment">

          <div class="q-pa-md">

            <search-teams-component :init-val="teamNameModel" @selected="handleTeamSelect" @blurred="handleTeamBlur" />

            <q-input v-model="areaPathModel" label="Area Path *" lazy-rules
              :rules="[(val) => (val && val.length) || 'Area path is required']" />

            <q-input v-model="iterationPathModel" label="Iteration Path *" lazy-rules
              :rules="[(val) => (val && val.length) || 'Iteration path is required']" />

            <q-input v-model="tags" label="Tag(s) *" lazy-rules
              :rules="[(val) => (val && val.length) || 'Tag(s) required']" />

          </div>

        </q-expansion-item>

        <q-splitter v-model="splitterModel">

          <template v-slot:before>
            <div class="q-pa-md">
              <div class="text-h4 q-mb-md">Raw</div>
              <div class="q-my-md">
                <codemirror v-show="txt" v-model="txt" :options="editorOptions" @blur="handleBlur" />
              </div>
            </div>
          </template>

          <template v-slot:after>
            <div class="q-pa-md">
              <div class="text-h4 q-mb-md">Tree</div>
              <div class="q-my-md">
                <tree-component v-if="showTree" :data="tree" />
              </div>
            </div>
          </template>

        </q-splitter>

      </div>

      <br />

      <div class="button-container q-pa-sm">
        <q-btn unelevated color="accent" padding="sm lg" label="Create" :disable="!yml" @click="handleCreateClick" />
      </div>
    </div>
  </div>

  <proc-manager-component @processing-complete="handleProcComplete" v-if="processing" />
</template>
<script>
import { reactive, toRefs, ref, inject, watch, computed } from "vue";
import { storeToRefs } from 'pinia'
import { CmdTypes } from "@/types/cmd-types";
import { useBulkCreateAzdoWisStore } from "@/stores/bulk-create-azdo-wis.store";
import { useTeamSettingsStore } from "@/stores/team-settings.store";
import { importStamp } from "@/services/timestamp.service";
import ProcManagerComponent from "@/components/ProcManagerComponent.vue";
import SearchTeamsComponent from "@/components/azdo/SearchTeamsComponent.vue";
import TreeComponent from "@/components/TreeComponent.vue";
import { Codemirror } from 'vue-codemirror';

export default {
  name: "BulkCreateAzdoWisView",
  components: {
    ProcManagerComponent,
    SearchTeamsComponent,
    TreeComponent,
    Codemirror
  },
  setup() {
    const cmdService = inject("cmdService");
    const store = useBulkCreateAzdoWisStore();
    const teamSettingsStore = useTeamSettingsStore();

    const { yml, obj } = storeToRefs(store);
    const { refreshFromYml, loadCyberdyneMdlcYml, loadGenysisMdlcYml, loadChapmansPeakSdlcYml } = store;
    const { iterationPath, areaPath } = storeToRefs(teamSettingsStore);
    const { init } = teamSettingsStore;

    const processing = ref(false);
    const txt = ref(null);
    const teamNameModel = ref(null);
    const areaPathModel = ref(null);
    const tags = ref(null);
    const iterationPathModel = ref(null);
    const tree = ref(null);
    const splitterModel = ref(60);
    const editorOptions = ref({
      mode: 'yaml',
      lineNumbers: true,
      theme: 'default',
      tabSize: 2
    });
    const showEnrichment = ref(false);

    const showTree = computed(() => tree.value && tree.value.length);

    const data = reactive({
      yml,
      processing,
      txt,
      teamNameModel,
      areaPathModel,
      tags,
      iterationPathModel,
      tree,
      splitterModel,
      editorOptions,
      showTree,
      showEnrichment
    });

    const buildEnrichers = () => {
      const enrichers = [
        (o) => o.tags = importStamp()
      ];

      if (iterationPathModel.value) enrichers.push((o) => o.iteration_path = iterationPathModel.value);
      if (areaPathModel.value) enrichers.push((o) => o.area_path = areaPathModel.value);
      if (tags.value) enrichers.push((o) => o.tags += `;${tags.value}`);

      return enrichers;
    };

    const handleCreateClick = async (e) => {
      if (!e) return;

      const cmd = {
        cmdType: CmdTypes.BULK_CREATE_UNITS_OF_WORK,
        cmdData: { cmds: obj.value },
      };

      await cmdService.publishAzdoProxyCmd({ reqs: [cmd] });

      processing.value = true;
    };

    const handleProcComplete = () => {
      txt.value = [];
      processing.value = false;
    };

    const handleBlur = (e) => {
      if (!e) return;
      if (!txt.value) return;

      yml.value = txt.value;

      refreshFromYml(buildEnrichers());

      txt.value = yml.value;
      tree.value = obj.value;
    }

    const handleTeamSelect = async (e) => {
      if (!e || e === "") return;
      teamNameModel.value = e;
      await init(e)
    };

    const handleTeamBlur = async (e) => {
      if (!e || e === "") return;
      if (teamNameModel.value === e) return;

      teamNameModel.value = e;
      await init(e)
    };

    const handleCyberdyneClick = (e) => {
      if (!e || e === "") return;

      txt.value = loadCyberdyneMdlcYml();

      handleBlur("e");
    };

    const handleGenisysClick = (e) => {
      if (!e || e === "") return;
      txt.value = loadGenysisMdlcYml();
      handleBlur("");
    };

    const handleChapmansPeakClick = (e) => {
      if (!e || e === "") return;
      txt.value = loadChapmansPeakSdlcYml();
      handleBlur("");
    };

    watch(() => areaPath.value, (newVal) => {
      if (!newVal) return;
      areaPathModel.value = newVal;
    });

    watch(() => iterationPath.value, (newVal) => {
      if (!newVal) return;
      iterationPathModel.value = newVal;
    });

    // watch(() => obj.value, (newVal) => {
    //   if (!newVal) return;
    //   tree.value = obj.value;
    // });

    return {
      ...toRefs(data),
      handleCreateClick,
      handleProcComplete,
      handleBlur,
      handleTeamSelect,
      handleTeamBlur,
      handleCyberdyneClick,
      handleGenisysClick,
      handleChapmansPeakClick
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

.button-container {
  display: flex;
  justify-content: flex-end;
}
</style>