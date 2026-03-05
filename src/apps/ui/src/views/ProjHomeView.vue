<template>
  <div class="projectHome">
    <!-- Header Section -->
    <div class="header">
      <div class="frameParent">
        <!-- Project Title and Owner -->
        <div class="projectTitleParent">
          <q-item-label class="text-h6 text-content text-weight-bold">{{ state.name }}</q-item-label>
          <q-item-label class="text-subtitle2 text-weight-medium ellipsis" caption>{{ state.summary?.assigned_to || 'Not assigned' }}</q-item-label>
        </div>

        <!-- Stats Group -->
        <div class="statsGroup">
          <div class="teams">
            <q-icon size="20px" name="groups" class="q-pr-xs" />
            <div class="div">{{ state.summary?.no_of_teams }}</div>
            <q-tooltip :offset="[-0, -5]">Teams</q-tooltip>
          </div>
          <div class="teams">
            <q-icon size="xs" name="assignment" class="q-pr-xs" />
            <div class="div">{{ state.summary?.no_of_units }}</div>
            <q-tooltip :offset="[0, -5]">Work Items</q-tooltip>
          </div>
          <div class="teams">
            <q-icon size="19px" name="sym_r_schedule" class="q-pr-xs" />
            <div class="div">{{ state.summary?.completed_work }}</div>
            <q-tooltip :offset="[0, -5]">Hours Spent</q-tooltip>
          </div>
        </div>
      </div>

      <!-- Button and Options -->
      <div class="buttonParent">
        <!-- Conditionally render the pin button if the project is pinned -->
        <q-btn
          v-if="isPinned"
          color="primary"
          round
          flat
          size="xs"
          icon="push_pin"
          class="q-mr-sm q-pt-xs"
          @click="handleUnpinClick(state.id)"
        >
          <q-tooltip>Unpin</q-tooltip>
        </q-btn>
        <q-chip clickable text-color="accent" class="button tag" @click="copyTagToClipboard(state.tag)">{{ state.tag }}</q-chip>
        <q-btn color="grey-7" round flat icon="more_horiz">
          <q-menu class="project-options-menu" auto-close fit anchor="bottom left" self="top left" transition-show="jump-down" transition-hide="jump-up">
            <q-btn-group flat style="height: 46px">
              <q-btn
                v-if="!isPinned"
                style="padding: 0 12px"
                @click="handlePinClick(state.id)"
                :icon="state.is_pinned === 'true' ? 'sym_r_push_pin' : 'push_pin'"
              />
              <q-btn style="padding: 0 12px" @click="handleEditClick" icon="sym_r_edit_square" />
              <q-btn style="padding: 0 12px" icon="sym_r_delete" />
            </q-btn-group>
          </q-menu>
        </q-btn>
      </div>
    </div>

    <!-- Main Area -->
    <div class="mainArea">
      <!-- Side Info Section -->
      <div class="sideInfo">
        <!-- Top Info -->
        <div class="topInfo">
          <div class="date">
            <q-icon size="20px" name="sym_r_track_changes" alt="" />
            <div class="div">{{ formattedTargetDate }}</div>
          </div>
          <div :class="['healthStatus', getHealthStatusClass(state.summary?.risk_impact_status)]">
            <div class="div">{{ state.summary?.status || 'Unknown' }}</div>
            <div :class="['healthStatusChild', getHealthStatusIconClass(state.summary?.risk_impact_status)]" />
          </div>
        </div>

        <!-- Progress Section -->
        <div class="progress">
          <div class="projectProgressParent">
            <div class="div">Project Progress</div>
            <div class="div3">{{ state.summary?.perc_complete }}%</div>
          </div>
          <div class="progressBar">
            <div class="progressBarChild" />
            <div class="progressBarItem" :style="{ width: state.summary?.perc_complete + '%' }" />
          </div>
          <div class="frameGroup">
            <div class="closed-wi-frame">
              <div class="div">{{ state.summary?.no_of_complete_units || 'N/A' }}</div>
              <q-tooltip>Closed Work Items</q-tooltip>
            </div>
            <div class="active-wi-frame">
              <div class="div">{{ state.summary?.no_of_active_units || 'N/A' }}</div>
              <q-tooltip>Active Work Items</q-tooltip>
            </div>
            <div class="new-wi-frame">
              <div class="div">{{ state.summary?.no_of_new_units || 'N/A' }}</div>
              <q-tooltip>New Work Items</q-tooltip>
            </div>
          </div>
        </div>

        <!-- Created By Section -->
        <!-- <div class="created-by">
          <div class="created-by-parent">
            <div class="div">Created By</div>
          </div>
          <div>{{ state.user_id || "no user id available" }}</div>
        </div> -->

        <!-- Actions Section -->
        <div class="actions">
          <div class="div">Work Item Actions</div>
          <project-actions-manager-component/>
        </div>
      </div>

      <!-- Visualizations Section -->
      <div :class="['visualizations', { fullscreen: isFullscreen }]">
        <div v-if="!isFullscreen" class="header1">
          <div class="div">Graphs and Analysis</div>
          <q-btn flat round icon="sym_r_expand_content" @click="toggleFullscreen" />
        </div>
        <q-select dense class="dropdown" outlined v-model="model" :options="chartOptions" label="Select View" @update:model-value="handleChartClick" />
        <component :is="selectedChartComponent" :chart-id="selectedChartId" :key="selectedChartId"/>
      </div>
    </div>

    <!-- Floating Button to Exit Fullscreen -->
    <q-btn
      v-if="isFullscreen"
      fab
      bottom
      left
      color="accent"
      icon="close"
      @click="toggleFullscreen"
      class="fullscreen-exit-btn"
    />
  </div>
</template>

<script>
import { markRaw, ref, onMounted, computed, inject, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectDetailsStore } from '@/stores/project-details.store';
import { useProjectsStore } from "@/stores/projects.store";
import { useLoadingStore } from '@/stores/loading.store';
import { copyToClipboard, useQuasar } from 'quasar';
import { CHART_TYPES_LIST } from "@/services/charts.service";
import { isDiff } from "@/services/diff.service";
import { deepCopy } from "@/services/clone.service";
import ProjectActionsManagerComponent from "@/components/ProjectActionsManagerComponent.vue";

import ChartComponent from "@/components/ChartComponent.vue";
import ExpandableTreeComponent from "@/components/ExpandableTreeComponent.vue";
import NestedTreeMapComponent from "@/components/charts/NestedTreeMapComponent.vue";

function formatDate(dateString) {
  if (!dateString) return 'Not defined';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB').format(date); // 'en-GB' for DD/MM/YYYY format
}

export default {
  name: 'ProjHomeView',
  components: {
    ChartComponent,
    ExpandableTreeComponent,
    NestedTreeMapComponent,
    ProjectActionsManagerComponent
  },
  setup() {
    const model = ref(null);
    const selectedChartComponent = ref(null);
    const selectedChartId = ref(null);
    const isFullscreen = ref(false);

    const projectDetailsStore = useProjectDetailsStore();
    const { state } = storeToRefs(projectDetailsStore);
    const { init: refreshProjectDetails } = projectDetailsStore;

    const projectsStore = useProjectsStore();
    const { pinProject, unpinProject } = projectsStore;

    const loadingStore = useLoadingStore();
    const { loading } = storeToRefs(loadingStore);

    let originalState = {};

    const route = useRoute();
    onMounted(async () => {
      const projectId = route.params.projectId;
      await refreshProjectDetails(projectId);
      originalState = deepCopy(state.value);
    });

    watch(
      [state],
      async () => {
        if (isDiff(state, originalState)) {
          const projectId = route.params.projectId;
          await refreshProjectDetails(projectId);
          originalState = deepCopy(state.value);
        }
      },
      { deep: true }
    );

    const navService = inject("navService");
    const $q = useQuasar();

    const handlePinClick = async (projectId) => {
      if (!projectId) return;
      await pinProject(projectId);
      await refreshProjectDetails(projectId);
    };

    const handleUnpinClick = async (projectId) => {
      if (!projectId) return;
      await unpinProject(projectId);
      await refreshProjectDetails(projectId);
    };

    const handleEditClick = () => {
      if (!state.value.summary) return;
      loading.value = true;
      navService.goToEditProject(state.value.summary.id);
    };

    const copyTagToClipboard = (tag) => {
      copyToClipboard(tag)
        .then(() => {
          $q.notify({
            message: `Tag "${tag}" copied to clipboard`,
            position: 'bottom-right',
            timeout: 2000,
          });
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
          $q.notify({
            message: `Failed to copy tag "${tag}"`,
            position: 'bottom-right',
            color: 'negative',
            timeout: 2000,
          });
        });
    };

    const chartOptions = CHART_TYPES_LIST.map(chart => ({
      label: chart.description,
      value: chart.id
    }));

    const chartComponents = {
      "tidy-tree": markRaw(ChartComponent),
      "expandable-tree": markRaw(ExpandableTreeComponent),
      "nested-treemap": markRaw(NestedTreeMapComponent),
      "packed-circle": markRaw(ChartComponent),
      "radial-cluster": markRaw(ChartComponent),
      "mldlc": markRaw(ChartComponent),
      "sdlc": markRaw(ChartComponent),
      "force-directed-tree": markRaw(ChartComponent),
      "zoomable-sunburst": markRaw(ChartComponent),
    };

    const handleChartClick = (selectedChart) => {
      const chartId = selectedChart.value;
      selectedChartComponent.value = chartComponents[chartId] || null;
      selectedChartId.value = chartId;
      console.log('Selected chart:', selectedChart);
    };

    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value;
    };

    const getHealthStatusClass = (status) => {
      switch (status) {
        case "Red":
          return "bg-color-red";
        case "Amber":
          return "bg-color-yellow";
        case "Green":
          return "bg-color-green";
        default:
          return "bg-color-default";
      }
    }

    const getHealthStatusIconClass = (status) => {
      switch (status) {
        case "Red":
          return "dot-color-red";
        case "Amber":
          return "dot-color-yellow";
        case "Green":
          return "dot-color-green";
        default:
          return "dot-color-default";
      }
    }

    const isPinned = computed(() => state.value.is_pinned === 'true');

    const formattedTargetDate = computed(() => formatDate(state.value.summary?.utc_target_timestamp));

    return {
      state,
      isPinned,
      loading,
      model,
      selectedChartComponent,
      selectedChartId,
      isFullscreen,
      refreshProjectDetails,
      handlePinClick,
      handleUnpinClick,
      handleEditClick,
      copyTagToClipboard,
      handleChartClick,
      toggleFullscreen,
      chartOptions,
      getHealthStatusClass,
      getHealthStatusIconClass,
      formattedTargetDate
    };
  },
};
</script>

<style lang="scss" scoped>
@import '@/styles/global.scss';

.projectHome {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 16px 16px 0;
  box-sizing: border-box;
  gap: 24px;
  text-align: left;
  font-size: 24px;
  height: calc(100vh - 77px);
  overflow: hidden;
}

.header {
  align-self: stretch;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0px 8px;
}

.frameParent {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 34px;
}

.projectTitleParent {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
}

.statsGroup {
  height: 49px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  font-size: 16px;
}

.teams {
  align-self: stretch;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 3px;
}

.userGroupIcon {
  width: 24px;
  position: relative;
  height: 24px;
  overflow: hidden;
  flex-shrink: 0;
}

.div {
  font-weight: 600;
}

.buttonParent {
  align-self: stretch;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #4683b5;
}

.button {
  border-radius: 24px;
  background-color: #d3e2ee;
  height: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  box-sizing: border-box;
}

.tag {
  position: relative;
  font-weight: 600;
  font-size: 12px !important;
}

.mainArea {
  align-self: stretch;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 16px;
}

.sideInfo {
  align-self: stretch;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
}

.topInfo {
  align-self: stretch;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
}

.date {
  width: 145px;
  max-width: 145px;
  border-radius: 12px;
  background-color: #fff;
  border: 3px solid #eef1f4;
  font-size: 14px;
  height: 48px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.healthStatus {
  width: 145px;
  max-width: 145px;
  border-radius: 12px;
  background-color: #fcecc0;
  height: 48px;
  font-size: 14px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  color: #c59823;
}

.healthStatusChild {
  width: 15px;
  position: relative;
  border-radius: 50%;
  background-color: #c59823;
  height: 15px;
}

.progress {
  width: 300px;
  border-radius: 16px;
  background-color: #fff;
  border: 3px solid #eef1f4;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px;
  gap: 16px;
}

.projectProgressParent {
  align-self: stretch;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.div3 {
  position: relative;
  letter-spacing: -0.02em;
  line-height: 22px;
  font-weight: 600;
  text-align: right;
}

.progressBar {
  align-self: stretch;
  position: relative;
  height: 8px;
}

.progressBarChild {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0%;
  right: 0%;
  bottom: 0%;
  left: 0%;
  border-radius: 40px;
  background-color: #eef1f4;
}

.progressBarItem {
  position: absolute;
  height: 100%;
  width: 60%;
  top: 0%;
  right: 40%;
  bottom: 0%;
  left: 0%;
  border-radius: 40px;
  background-color: #f6be2c;
}

.frameGroup {
  align-self: stretch;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  color: #4e7648;
}

.closed-wi-frame {
  flex: 1;
  background-color: #cbe5c8;
  overflow: hidden;
  height: 44px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
}

.active-wi-frame {
  flex: 1;
  background-color: #d3e2ee;
  overflow: hidden;
  height: 44px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 10px;
  color: #4683b5;
}

.new-wi-frame {
  flex: 1;
  background-color: #eef1f4;
  overflow: hidden;
  height: 44px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 10px;
  color: #9ba5b7;
}

.created-by {
  width: 300px;
  border-radius: 16px;
  background-color: #fff;
  border: 3px solid #eef1f4;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 16px;
  gap: 16px;
}

.created-by-parent {
  align-self: stretch;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.actions {
  align-self: stretch;
  border-radius: 16px;
  background-color: #fff;
  border: 3px solid #eef1f4;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 16px;
  gap: 16px;
}

.frameContainer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 8px;
  font-size: 14px;
}

.refreshParent {
  width: 268px;
  overflow: hidden;
  border-radius: 8px;
}

.visualizations {
  align-self: stretch;
  flex: 1;
  border-radius: 16px;
  background-color: #fff;
  border: 3px solid #eef1f4;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 24px 24px 24px;
  gap: 8px;
  height: fit-content;
  max-height: 100%;
}

.visualizations.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2001;
  background-color: #fff;
  padding: 16px;
  overflow: auto;
}

.header1 {
  align-self: stretch;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.frameDiv {
  align-self: stretch;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 41px;
}

.dropdownWrapper {
  align-self: stretch;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}

.dropdown {
  align-self: stretch;
}

.textInput {
  align-self: stretch;
  flex: 1;
  position: relative;
  border-radius: 6px;
  background-color: #fff;
  border: 1px solid #545f71;
}

.text {
  position: absolute;
  top: 13px;
  left: 12px;
  display: inline-block;
  width: 321px;
}

.selectorIcon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  overflow: hidden;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.fullscreen-exit-btn {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 2002;
}

/* Custom background color and font classes */
.bg-color-red {
  background-color: #EEC3C3 !important;
  color: #772020 !important;
}

.bg-color-yellow {
  background-color: #FCECC0 !important;
  color: #C59823 !important;
}

.bg-color-green {
  background-color: #CBE5C8 !important;
  color: #4E7648 !important;
}

.bg-color-default {
  background-color: #FFFFFF !important;
  color: $primary !important;
}

.dot-color-red {
  background-color: #772020 !important;
}

.dot-color-yellow {
  background-color: #C59823 !important;
}

.dot-color-green {
  background-color: #4E7648 !important;
}

.dot-color-default {
  background-color: $primary !important;
}
</style>
