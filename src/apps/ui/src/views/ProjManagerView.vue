<template>
  <div class="proj-manager-view">
    <div class="toolbar-container">
      <project-list-toolbar-component
        :team-options="teamOptions"
        @projectCreated="refreshProjectList"
        @sortOptionChanged="({ option, order }) => { sortOption = option; sortOrder = order; }"
        @filterTextChanged="filterText = $event"
        @teamsFilterChanged="teamsFilter = $event"
      />
    </div>

    <!-- <q-inner-loading
      :showing="loading"
      label="Please wait..."
      label-class="text-teal"
      label-style="font-size: 1.1em"
    /> -->

    <div class="cards-container" v-show="menuTab === 'mine' && !loading">
      <proj-summary-component
        v-for="i in usrProjects"
        :key="i.id"
        :item="i"
        @view-click="handleViewClick"
        @visuals-click="handleVisualsClick"
        @actions-click="handleActionsClick"
        @pin-click="handlePinClick"
        @unpin-click="handleUnpinClick"
      />
    </div>

    <div class="cards-container" v-show="menuTab === 'all' && !loading">
      <proj-summary-component
        v-for="i in projects"
        :key="i.id"
        :item="i"
        @view-click="handleViewClick"
        @visuals-click="handleVisualsClick"
        @actions-click="handleActionsClick"
        @pin-click="handlePinClick"
        @unpin-click="handleUnpinClick"
      />
    </div>

    <!-- Skeleton Loaders -->
    <div class="cards-container" v-show="loading">
      <q-card v-for="n in 5" :key="n" class="card-width card-container">
        <!-- Header Skeleton -->
        <q-card-section class="q-pa-md" style="background-color: #EEF1F4">
          <div class="row items-center justify-between no-wrap">
            <div class="row items-center">
              <q-skeleton type="QAvatar" size="24px" class="q-mr-md" />
              <q-skeleton type="text" width="100px" />
            </div>
            <div class="col-auto row items-center">
              <q-icon name="more_horiz" color="grey-4" size="26px" />
            </div>
          </div>
        </q-card-section>

        <!-- Project Info Skeleton -->
        <q-card-section horizontal class="justify-between">
          <q-card-section class="q-pa-md">
            <q-skeleton type="text" width="200px" />
            <q-skeleton type="text" width="100px" />
          </q-card-section>
          <q-card-section class="flex justify-end">
            <q-skeleton type="QChip" width="50px" height="20px" />
          </q-card-section>
        </q-card-section>

        <!-- Work Items Progress Skeleton -->
        <div class="row work-items-progress-bar q-px-md flex justify-between">
          <q-skeleton type="rect" width="32%" height="10px" style="border-radius: 16px" />
          <q-skeleton type="rect" width="32%" height="10px" style="border-radius: 16px" />
          <q-skeleton type="rect" width="32%" height="10px" style="border-radius: 16px" />
        </div>

        <!-- Additional Metrics Skeleton -->
        <q-card-section horizontal class="flex justify-between">
          <q-item class="q-py-md items-center">
            <q-skeleton type="QChip" width="50px" height="16px" />
          </q-item>
          <q-item class="q-pa-sm items-center">
            <div class="row items-center q-px-sm">
              <q-skeleton type="QIcon" size="16px" class="q-mr-sm" />
              <q-skeleton type="text" width="30px" />
            </div>
            <div class="row items-center q-px-sm">
              <q-skeleton type="QIcon" size="16px" class="q-mr-sm" />
              <q-skeleton type="text" width="30px" />
            </div>
            <div class="row items-center q-px-sm">
              <q-skeleton type="QIcon" size="16px" class="q-mr-sm" />
              <q-skeleton type="text" width="30px" />
            </div>
          </q-item>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs, onMounted, onUnmounted, watch, inject, computed, ref } from "vue";
import { storeToRefs } from 'pinia';
import { useLayoutStore } from "@/stores/layout.store";
import { useLoadingStore } from "@/stores/loading.store";
import { useProjectsStore } from "@/stores/projects.store";
import ProjSummaryComponent from "@/components/ProjSummaryComponent.vue";
import ProjectListToolbarComponent from "@/components/ProjectListToolbarComponent.vue";

export default {
  name: "ProjManagerView",
  components: { ProjSummaryComponent, ProjectListToolbarComponent },
  setup() {
    const navService = inject("navService");
    const layoutStore = useLayoutStore();
    const loadingStore = useLoadingStore();
    const projectsStore = useProjectsStore();
    const INTERVAL_TIME = 7 * 1000;

    const { menuSearch, menuTab } = storeToRefs(layoutStore);
    const { loading } = storeToRefs(loadingStore);
    const { enrichedProjects, enrichedUsrProjects } = storeToRefs(projectsStore);
    const { init: initProjects, pinProject, unpinProject } = projectsStore;

    const sortOption = ref('targetDate');
    const sortOrder = ref('asc');
    const filterText = ref('');
    const teamsFilter = ref([]);

    const filteredUsrProjs = computed(() => {
      const searchText = filterText.value.toLowerCase();
      const menuSearchText = menuSearch.value.toLowerCase();
      return enrichedUsrProjects.value.filter((p) => 
        p.title?.toLowerCase().includes(searchText) && 
        p.title?.toLowerCase().includes(menuSearchText) &&
        (teamsFilter.value.length === 0 || teamsFilter.value.some(team => p.data?.summary?.teams?.map(t => t.split('\\').pop()).includes(team)))
      );
    });

    const filteredProjs = computed(() => {
      const searchText = filterText.value.toLowerCase();
      const menuSearchText = menuSearch.value.toLowerCase();
      return enrichedProjects.value.filter((p) => 
        p.title?.toLowerCase().includes(searchText) && 
        p.title?.toLowerCase().includes(menuSearchText) &&
        (teamsFilter.value.length === 0 || teamsFilter.value.some(team => p.data?.summary?.teams?.map(t => t.split('\\').pop()).includes(team)))
      );
    });

    const sortedUsrProjs = computed(() => {
      return [...filteredUsrProjs.value].sort((a, b) => {
        const order = sortOrder.value === 'asc' ? 1 : -1;
        switch (sortOption.value) {
          case 'targetDate':
            return order * (new Date(a.data?.summary?.utc_target_timestamp) - new Date(b.data?.summary?.utc_target_timestamp));
          case 'lastModified':
            return order * (new Date(a.data?.utc_updated_timestamp) - new Date(b.data?.utc_updated_timestamp));
          case 'dateCreated':
            return order * (new Date(a.data?.utc_created_timestamp) - new Date(b.data?.utc_created_timestamp));
          default:
            return 0;
        }
      });
    });

    const sortedProjs = computed(() => {
      return [...filteredProjs.value].sort((a, b) => {
        const order = sortOrder.value === 'asc' ? 1 : -1;
        switch (sortOption.value) {
          case 'targetDate':
            return order * (new Date(a.data?.summary?.utc_target_timestamp) - new Date(b.data?.summary?.utc_target_timestamp));
          case 'lastModified':
            return order * (new Date(a.data?.utc_updated_timestamp) - new Date(b.data?.utc_updated_timestamp));
          case 'dateCreated':
            return order * (new Date(a.data?.utc_created_timestamp) - new Date(b.data?.utc_created_timestamp));
          default:
            return 0;
        }
      });
    });

    const allTeams = computed(() => {
      const teamsSet = new Set();
      enrichedProjects.value.forEach(project => {
        if (project.data?.summary?.teams) {
          project.data.summary.teams.forEach(team => teamsSet.add(team.split('\\').pop()));
        }
      });
      enrichedUsrProjects.value.forEach(project => {
        if (project.data?.summary?.teams) {
          project.data.summary.teams.forEach(team => teamsSet.add(team.split('\\').pop()));
        }
      });
      return Array.from(teamsSet).map(team => ({ label: team, value: team }));
    });

    const data = reactive({
      usrProjects: sortedUsrProjs,
      projects: sortedProjs,
      loading,
      menuTab,
      teamOptions: allTeams,
    });

    const handleViewClick = (e) => {
      if (!e) return;
      navService.goToProjHome(e.data.id);
    };

    const handleVisualsClick = (e) => {
      if (!e) return;
      navService.goToVis(e.data.id);
    };

    const handleActionsClick = (e) => {
      if (!e) return;
      navService.goToActions(e.data.id);
    };

    const handlePinClick = async (e) => {
      if (!e) return;
      await pinProject(e.data.id);
      await initProjects();
    };

    const handleUnpinClick = async (e) => {
      if (!e) return;
      await unpinProject(e.data.id);
      await initProjects();
    };

    const handleAddClick = (e) => {
      if (!e) return;
      navService.newProject();
    };

    const refreshProjectList = async () => {
      await initProjects();
    };

    let intervalId = 0;
    const initInterval = () => {
      intervalId = setInterval(async () => {
        await initProjects();
      }, INTERVAL_TIME);
    };

    watch(menuSearch, (newVal) => {
      console.log('menuSearch', newVal);
    });

    watch(menuTab, async (newVal) => {
      loading.value = true;
      await initProjects();
      loading.value = false;
      console.log('menuTab', newVal);
    });

    watch([sortOption, sortOrder], (newVal) => {
      console.log('sortOption or sortOrder changed', newVal);
    });

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });

    onMounted(async () => {
      loading.value = true;
      await initProjects();
      loading.value = false;
      initInterval();
    });

    return {
      ...toRefs(data),
      handleViewClick,
      handleVisualsClick,
      handleActionsClick,
      handlePinClick,
      handleUnpinClick,
      handleAddClick,
      refreshProjectList,
      sortOption,
      sortOrder,
      filterText,
      teamsFilter,
    };
  },
};
</script>

<style lang="scss" scoped>
.proj-manager-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.toolbar-container {
  position: sticky;
  top: 77px; /* Adjust this value to match the height of your top nav bar */
  z-index: 10; /* Ensure it stays above other content */
  background-color: #f5f6fa; /* Match the background color to avoid overlap issues */
  padding: 0 24px 0 0;
}

.content-container {
  flex: 1;
  overflow-y: auto; /* Enable vertical scrolling */
  padding-top: 16px; /* Adjust padding as needed */
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 36px;
  padding: 0 16px 16px 4px;
}
</style>