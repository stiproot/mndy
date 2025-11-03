<template>
  <div>
    <q-toolbar class="q-pa-none">
      <!-- Left Side: Tab Bar Selection -->
      <q-tabs no-caps stretch v-model="projectStatus" class="q-mr-md">
        <q-tab name="in-progress" label="In Progress" />
        <q-tab name="not-started" label="Not Started" />
      </q-tabs>

      <q-space />

      <!-- Right Side: Buttons for Sort, Filter, Settings, and Create New -->
      <div class="toolbar-buttons">
        <q-btn flat round size="sm" icon="sort">
          <q-tooltip>Sort</q-tooltip>
          <q-menu class="sort-menu-container" anchor="top right" self="bottom right" transition-show="jump-down" transition-hide="jump-up">
            <div class="text-subtitle1 text-weight-bold q-mb-md q-px-xs">Sort By</div>
            <q-list seperator class="q-gutter-y-sm">
              <q-item style="border-radius: 8px; min-height: 40px; padding: 0 12px;" clickable v-for="option in sortOptions" :key="option.value" @click="setSortOption(option.value)" :class="['items-center text-body2 justify-between', { 'selected-option': sortOption === option.value }]">
                    {{ option.label }}
                    <q-icon right :name="getSortIcon(option.value)" />
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn flat round size="sm" icon="filter_list" @click="toggleFilterToolbar">
          <q-tooltip>Filter</q-tooltip>
        </q-btn>
        <q-btn flat round size="sm" icon="settings" @click="handleSettingsClick">
          <q-tooltip>Settings</q-tooltip>
        </q-btn>
        <q-btn round unelevated icon="add" size="sm" color="accent" @click="showModal = true">
          <q-tooltip>New Project</q-tooltip>
        </q-btn>
      </div>

      <!-- Create New Project Modal -->
      <create-new-project-modal-component v-model="showModal" @create-from-tag="openCreateFromTagModal" />
      
      <!-- Create New Project From Tag Modal -->
      <create-new-project-from-tag-modal-component v-model="showCreateFromTagModal" @projectCreated="handleProjectCreated" />
    </q-toolbar>

    <!-- Conditional Filter Toolbar -->
    <q-toolbar v-if="showFilterToolbar" class="filter-toolbar">
      <!-- Add your filter controls here -->
      <q-input borderless v-model="filterText" placeholder="Filter by keyword" :dense="dense" class="col-7">
        <template v-slot:prepend>
          <q-icon name="sym_r_filter_list" />
        </template>
      </q-input>

      <div class="row justify-end no-wrap items-center">
        <q-select
          v-model="selectedTeams"
          :options="teamOptions"
          multiple
          dense
          filled
          borderless
          label="Team"
          emit-value
          map-options
          style="min-width: 100px; max-width: 300px; margin-right: 20px"
          @update:model-value="handleTeamsFilterChange"
        >
          <!-- <template v-slot:prepend>
            <q-icon name="groups" />
          </template> -->
          <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
            <q-item v-bind="itemProps">
              <q-item-section>
                <q-item-label class="text-body2" v-html="opt.label" />
              </q-item-section>
              <q-item-section side>
                <q-checkbox size="sm" dense :model-value="selected" @update:model-value="toggleOption(opt)" />
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-tabs no-caps v-model="menuTab" shrink stretch class="q-mr-md">
          <q-tab name="all" label="All" />
          <q-tab name="mine" label="Mine" />
        </q-tabs>

        <q-btn flat round size="sm" icon="close" @click="toggleFilterToolbar">
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </div>

    </q-toolbar>
  </div>
</template>

<script>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useLayoutStore } from "@/stores/layout.store";
import CreateNewProjectModalComponent from "@/components/CreateNewProjectModalComponent.vue";
import CreateNewProjectFromTagModalComponent from "@/components/CreateNewProjectFromTagModalComponent.vue";

export default {
  name: "ProjectListToolbarComponent",
  components: { 
    CreateNewProjectModalComponent,
    CreateNewProjectFromTagModalComponent
  },
  props: {
    teamOptions: {
      type: Array,
      required: true,
    },
  },
  emits: ["projectCreated", "filterTextChanged", "teamsFilterChanged"],
  setup(props, { emit }) {
    const layoutStore = useLayoutStore();
    const { menuTab } = storeToRefs(layoutStore);

    const projectStatus = ref('in-progress');
    const showModal = ref(false);
    const showCreateFromTagModal = ref(false);
    const showFilterToolbar = ref(false);
    const filterText = ref('');
    const showSortMenu = ref(false);
    const sortOption = ref('targetDateAsc');
    const selectedTeams = ref([]);

    const sortOptions = [
      { label: 'Target Date', value: 'targetDate' },
      { label: 'Last Modified', value: 'lastModified' },
      { label: 'Date Created', value: 'dateCreated' },
    ];

    const sortOrder = ref('asc');

    const handleSortClick = () => {
      // Handle sort click
    };

    const handleFilterClick = () => {
      // Handle filter click
    };

    const handleSettingsClick = () => {
      // Handle settings click
    };

    const toggleFilterToolbar = () => {
      showFilterToolbar.value = !showFilterToolbar.value;
    };

    const openCreateFromTagModal = () => {
      showModal.value = false;
      showCreateFromTagModal.value = true;
    };

    const handleProjectCreated = () => {
      emit("projectCreated");
    };

    const setSortOption = (option) => {
      if (sortOption.value === option) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortOption.value = option;
        sortOrder.value = 'asc';
      }
      showSortMenu.value = false;
      emit('sortOptionChanged', { option, order: sortOrder.value });
    };

    const getSortIcon = (option) => {
      if (sortOption.value === option) {
        return sortOrder.value === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down';
      }
      return '';
    };

    const handleTeamsFilterChange = (teams) => {
      emit('teamsFilterChanged', teams);
    };

    watch(filterText, (newVal) => {
      emit('filterTextChanged', newVal);
    });

    return {
      projectStatus,
      menuTab,
      showModal,
      showCreateFromTagModal,
      showFilterToolbar,
      filterText,
      showSortMenu,
      sortOption,
      sortOrder,
      sortOptions,
      selectedTeams,
      handleSortClick,
      handleFilterClick,
      handleSettingsClick,
      toggleFilterToolbar,
      openCreateFromTagModal,
      handleProjectCreated,
      setSortOption,
      getSortIcon,
      handleTeamsFilterChange,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-toolbar {
  width: 100%;
  min-height: 30px;
  height: 50px;
  background-color: white;
  box-shadow: 0px 8px 16px 0px #00000014, 0px 0px 4px 0px #0000000A;
  border-radius: 16px;
  margin-top: 24px;
  display: flex;
  padding: 0 16px;
  align-items: center;
}

.toolbar-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;
}

.sort-menu-container {
  border: 3px solid $tertiary;
  border-radius: 16px; 
  padding: 12px; 
  box-shadow: 0px 8px 16px 0px #00000014, 0px 4px 0px #0000000A;
}

.selected-option {
  background-color: $accent;
  color: white;
}

::v-deep .q-field__native > span {
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
  width: 100%;
}
</style>