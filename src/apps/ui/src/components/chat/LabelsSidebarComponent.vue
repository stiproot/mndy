<template>
  <div class="labels-sidebar">
    <div class="sidebar-header">
      <span class="header-title">Labels</span>
      <q-btn flat dense icon="add" size="sm" @click="showCreateDialog = true">
        <q-tooltip>Create label</q-tooltip>
      </q-btn>
    </div>

    <q-list dense class="labels-list">
      <q-item
        clickable
        :active="selectedLabelId === null"
        @click="selectLabel(null)"
      >
        <q-item-section avatar>
          <q-icon name="inbox" />
        </q-item-section>
        <q-item-section>All conversations</q-item-section>
      </q-item>

      <q-separator class="q-my-sm" />

      <q-item
        v-for="label in sortedLabels"
        :key="label.id"
        clickable
        :active="selectedLabelId === label.id"
        @click="selectLabel(label.id)"
      >
        <q-item-section avatar>
          <div
            class="label-color-indicator"
            :style="{ backgroundColor: label.color }"
          />
        </q-item-section>
        <q-item-section>{{ label.name }}</q-item-section>
        <q-item-section side>
          <q-btn
            flat
            dense
            round
            icon="more_vert"
            size="sm"
            @click.stop
          >
            <q-menu>
              <q-list dense>
                <q-item clickable v-close-popup @click="editLabel(label)">
                  <q-item-section avatar>
                    <q-icon name="edit" size="xs" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="deleteLabel(label.id)">
                  <q-item-section avatar>
                    <q-icon name="delete" size="xs" color="negative" />
                  </q-item-section>
                  <q-item-section class="text-negative">Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-item-section>
      </q-item>

      <div v-if="!hasLabels" class="empty-labels">
        <p class="text-grey-6 text-caption">No labels yet</p>
      </div>
    </q-list>

    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">{{ editingLabel ? 'Edit Label' : 'Create Label' }}</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="labelName"
            label="Label name"
            outlined
            dense
            autofocus
          />
          <div class="q-mt-md">
            <div class="text-caption q-mb-sm">Color</div>
            <div class="color-picker">
              <div
                v-for="color in labelColors"
                :key="color"
                :class="['color-option', { selected: labelColor === color }]"
                :style="{ backgroundColor: color }"
                @click="labelColor = color"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeDialog" />
          <q-btn
            color="primary"
            :label="editingLabel ? 'Save' : 'Create'"
            :disable="!labelName.trim()"
            @click="saveLabel"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { storeToRefs } from "pinia";
import { useLabelsStore } from "@/stores/labels.store";

const LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export default defineComponent({
  name: "LabelsSidebarComponent",
  setup() {
    const labelsStore = useLabelsStore();
    const { sortedLabels, selectedLabelId, hasLabels } = storeToRefs(labelsStore);

    const showCreateDialog = ref(false);
    const labelName = ref("");
    const labelColor = ref(LABEL_COLORS[0]);
    const editingLabel = ref(null);

    function selectLabel(labelId) {
      labelsStore.setSelectedLabel(labelId);
    }

    function editLabel(label) {
      editingLabel.value = label;
      labelName.value = label.name;
      labelColor.value = label.color;
      showCreateDialog.value = true;
    }

    function deleteLabel(labelId) {
      labelsStore.removeLabel(labelId);
      // TODO: Persist to backend
    }

    function closeDialog() {
      showCreateDialog.value = false;
      editingLabel.value = null;
      labelName.value = "";
      labelColor.value = LABEL_COLORS[0];
    }

    function saveLabel() {
      if (!labelName.value.trim()) return;

      if (editingLabel.value) {
        labelsStore.updateLabel(editingLabel.value.id, {
          name: labelName.value.trim(),
          color: labelColor.value,
        });
        // TODO: Persist to backend
      } else {
        const label = labelsStore.createLocalLabel(labelName.value.trim(), labelColor.value);
        labelsStore.addLabel(label);
        // TODO: Persist to backend
      }

      closeDialog();
    }

    return {
      sortedLabels,
      selectedLabelId,
      hasLabels,
      showCreateDialog,
      labelName,
      labelColor,
      labelColors: LABEL_COLORS,
      editingLabel,
      selectLabel,
      editLabel,
      deleteLabel,
      closeDialog,
      saveLabel,
    };
  },
});
</script>

<style scoped>
.labels-sidebar {
  width: 250px;
  height: 100%;
  background: #fafafa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.header-title {
  font-weight: 600;
  font-size: 16px;
}

.labels-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.label-color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.empty-labels {
  text-align: center;
  padding: 24px;
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.color-option:hover {
  border-color: rgba(0, 0, 0, 0.2);
}

.color-option.selected {
  border-color: #000;
}
</style>
