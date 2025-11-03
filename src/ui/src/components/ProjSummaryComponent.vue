<template>
  <q-card class="card-width card-container">
    <!-- header -->
    <q-card-section class="q-pa-xs" :style="{ backgroundColor: item.color }">
      <div class="row items-center justify-between no-wrap">
        <div class="row items-center q-ml-sm">
          <q-icon name="track_changes" size="20px" :class="[getProjectHealthTextColor(item.color), 'q-mr-sm', 'q-ml-xs']" />
          <div :class="[getProjectHealthTextColor(item.color)]" style="font-weight: 600">{{ item.data?.summary?.utc_target_timestamp || 'Not defined' }}</div>
        </div>

        <!-- project options -->
        <div class="col-auto row items-center">
          <!-- Conditionally render the pin button if the project is pinned -->
          <q-btn
            v-if="item.data?.is_pinned === 'true'"
            :class="getProjectHealthTextColor(item.color)"
            round
            flat
            size="xs"
            icon="push_pin"
            @click="handleActionClick('unpin-click', item)"
          >
            <q-tooltip>Unpin</q-tooltip>
          </q-btn>

          <q-btn :class="getProjectHealthTextColor(item.color)" round flat icon="more_horiz">
            <q-menu class="project-options-menu" :offset="[-15, -15]" auto-close fit anchor="top right" self="bottom left">
              <q-btn-group flat style="height: 46px">
                <q-btn style="padding: 0 12px" v-if="hasSummary" @click="handleActionClick(item.data?.is_pinned === 'true' ? 'unpin-click' : 'pin-click', item)" :icon="item.data?.is_pinned === 'true' ? 'sym_r_push_pin' : 'push_pin'" />
                <q-btn style="padding: 0 12px" @click="handleEditClick(item)" icon="sym_r_edit_square" />
                <q-btn style="padding: 0 12px" @click="handleActionClick('delete-click', item)" icon="sym_r_delete" />
              </q-btn-group>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </q-card-section>

    <!-- project info -->
    <q-card-section horizontal class="justify-between">
      <q-card-section
        class="cursor-pointer"
        :class="{ 'disabled': !hasSummary }"
        @click="handleActionClick('view-click', item)"
      >
        <q-item-label class="text-h6 text-content text-weight-bold">{{ item.title }}</q-item-label>
        <q-item-label class="text-subtitle2 text-weight-medium ellipsis" caption v-if="hasSummary">
          {{ item.data?.summary?.assigned_to || 'Not assigned' }}
        </q-item-label>
      </q-card-section>
      <q-card-section class="flex justify-end">
        <q-chip clickable @click="copyTagToClipboard(item.data?.tag)" size="sm" color="blue-2" text-color="accent" class="text-bold ellipsis">
          {{item.data?.tag}}
        </q-chip>
      </q-card-section>
    </q-card-section>

    <!-- work items progress -->
    <div
      class="work-items-progress-bar q-px-md cursor-pointer"
      :class="{ 'disabled': !hasSummary }"
      v-if="hasSummary"
      @click="handleActionClick('view-click', item)"
    >
      <div class="progress-bar-container">
        <div
          class="progress-bar-segment complete-work-items"
          :style="{ width: percComplete + '%' }"
        >
          <q-tooltip>Complete Work Items</q-tooltip>
        </div>
        <div
          class="progress-bar-segment active-work-items"
          :style="{ width: percActive + '%' }"
        >
          <q-tooltip>Active Work Items</q-tooltip>
        </div>
        <div
          class="progress-bar-segment new-work-items"
          :style="{ width: percNew + '%' }"
        >
          <q-tooltip>New Work Items</q-tooltip>
        </div>
      </div>
    </div>

    <!-- additional metrics -->
    <q-card-section
      horizontal
      class="flex justify-between cursor-pointer"
      :class="{ 'disabled': !hasSummary }"
      v-if="hasSummary"
      @click="handleActionClick('view-click', item)"
    >
      <q-item class="q-pa-sm items-center">
        <q-chip dense text-color="primary" color="transparent" class="text-weight-bold">{{ item.data?.summary?.perc_complete }}%</q-chip>
      </q-item>
      <q-item class="q-pa-sm items-center">
        <div class="row items-center text-body2 text-weight-bold q-px-sm">
          <q-icon size="20px" name="groups" class="q-pr-xs"/>
          <div class="items-center">
            {{ item.data?.summary?.no_of_teams }}
          </div>
          <q-tooltip>Teams</q-tooltip>
        </div>
        <div class="row items-center text-body2 text-weight-bold q-px-sm">
          <q-icon size="xs" name="assignment" class="q-pr-xs"/>
          <div class="items-center">
            {{ item.data?.summary?.no_of_units }}
          </div>
          <q-tooltip>Work Items</q-tooltip>
        </div>
        <div class="row items-center text-body2 text-weight-bold q-px-sm">
          <q-icon size="19px" name="sym_r_schedule" class="q-pr-xs"/>
          <div class="items-center">
            {{ item.data?.summary?.completed_work }}
          </div>
          <q-tooltip>Hours Spent</q-tooltip>
        </div>
      </q-item>
    </q-card-section>

    <!-- Skeleton Loader -->
    <q-card-section class="q-pb-none q-px-sm" v-else>
      <!-- Work Items Progress Skeleton -->
      <div class="row work-items-progress-bar q-px-sm flex justify-between">
        <q-skeleton type="rect" width="32%" height="10px" style="border-radius: 16px" />
        <q-skeleton type="rect" width="32%" height="10px" style="border-radius: 16px" />
        <q-skeleton type="rect" width="32%" height="10px" style="border-radius: 16px" />
      </div>

      <!-- Additional Metrics Skeleton -->
      <q-card-section horizontal class="flex justify-between">
        <q-item class="q-px-sm items-center">
          <q-skeleton type="QChip" width="50px" height="16px" />
        </q-item>
        <q-item class="q-py-sm q-px-none items-center">
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
    </q-card-section>
  </q-card>
</template>

<script>
import { copyToClipboard, useQuasar } from "quasar";
import { storeToRefs } from 'pinia'
import { useLoadingStore } from "@/stores/loading.store";
import { inject, computed } from "vue";

export default {
  name: "ProjSummaryComponent",
  props: { item: Object },
  setup(props, { emit }) {
    const navService = inject("navService");
    const loadingStore = useLoadingStore();

    const { loading } = storeToRefs(loadingStore);
    const hasSummary = computed(() => props.item.data?.summary && props.item.data?.summary !== null);
    const $q = useQuasar();

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

    const getProjectHealthTextColor = (color) => {
      switch (color) {
        case "#EEC3C3":
          return "text-color-red";
        case "#FCECC0":
          return "text-color-yellow";
        case "#CBE5C8":
          return "text-color-green";
        default:
          return "text-color-default";
      }
    };

    const emitEvt = (evtId, item) => {
      emit(evtId, item);
    };

    const handleActionClick = (evtId, e) => {
  if (evtId === 'view-click' && !hasSummary.value) {
    console.log('Cannot view project: summary is not available');
    return;
  }

  // if (evtId === 'delete-click') {
  //   $q.notify({
  //     message: `Project "${e.title}" has been deleted`,
  //     color: 'negative',
  //     position: 'bottom-right',
  //   });
  //   // Add your delete logic here
  // }

      emitEvt(evtId, e);
    };

    const handleEditClick = (e) => {
      if (!e) return;
      loading.value = true;
      navService.goToEditProject(e.data.id);
    };

    const percComplete = computed(() => props.item.data?.summary?.perc_complete || 0);
    const percActive = computed(() => props.item.data?.summary?.perc_active || 0);
    const percNew = computed(() => 100 - percComplete.value - percActive.value);

    return {
      hasSummary,
      handleActionClick,
      copyTagToClipboard,
      handleEditClick,
      getProjectHealthTextColor,
      percComplete,
      percActive,
      percNew
    };
  },
};
</script>

<style lang="scss">
@import '@/styles/global.scss';

.card-width {
  min-width: 400px;
  max-width: 600px;
  width: max-content;
  height: fit-content;
}

.card-container {
  border-radius: 16px;
  box-shadow: 4px 2px 8px 0px #0000000F, 0px 0px 4px 0px #0000000A;
}

.text-content {
  white-space: normal;
  overflow: hidden;
}

.pin-icon {
  font-size: small;
  float: right;
  margin-top: 5px;
  margin-right: 5px;
}

.my-bar .div {
  min-height: 20px;
  padding: 8px;
}

.work-items-progress-bar {
  width: 100%;
}

.project-options-menu {
  border-radius: 12px; 
  border: 3px solid $tertiary;
  box-shadow: 4px 2px 8px 0px #0000000F, 0px 0px 4px 0px #0000000A;
}

.progress-bar-container {
  display: flex;
  height: 10px;
  overflow: hidden;
}

.progress-bar-segment {
  height: 100%;
  border-radius: 10px; /* Apply border-radius to each segment */
}

.new-work-items {
  background-color: #9BA5B7;
}

.complete-work-items {
  background-color: #7EBF76;
}

.active-work-items {
  background-color: #4683B5;
  margin: 0 8px; /* Add margin to create space between segments */
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.disabled {
  pointer-events: none;
  opacity: 0.5;
}

/* Custom text color classes */
.text-color-red {
  color: #772020 !important;
}

.text-color-yellow {
  color: #C59823 !important;
}

.text-color-green {
  color: #4E7648 !important;
}

.text-color-default {
  color: #ffffff !important;
}
</style>