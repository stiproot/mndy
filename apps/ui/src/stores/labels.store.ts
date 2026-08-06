import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { ILabel } from "@/types/i-chat";
import { v4 as uuidv4 } from "uuid";

// Default label colors
const LABEL_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export const useLabelsStore = defineStore("labels-store", () => {
  // State
  const labels = ref<ILabel[]>([]);
  const selectedLabelId = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const selectedLabel = computed(() => {
    if (!selectedLabelId.value) return null;
    return labels.value.find(l => l.id === selectedLabelId.value) ?? null;
  });

  const hasLabels = computed(() => labels.value.length > 0);

  const sortedLabels = computed(() => {
    return [...labels.value].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Actions
  function setSelectedLabel(labelId: string | null): void {
    selectedLabelId.value = labelId;
  }

  function loadLabels(data: ILabel[]): void {
    labels.value = data;
    isLoading.value = false;
  }

  function setLoading(loading: boolean): void {
    isLoading.value = loading;
  }

  function setError(errorMessage: string | null): void {
    error.value = errorMessage;
  }

  function addLabel(label: ILabel): void {
    labels.value.push(label);
  }

  function updateLabel(labelId: string, updates: Partial<ILabel>): void {
    const index = labels.value.findIndex(l => l.id === labelId);
    if (index !== -1) {
      labels.value[index] = { ...labels.value[index], ...updates };
    }
  }

  function removeLabel(labelId: string): void {
    const index = labels.value.findIndex(l => l.id === labelId);
    if (index !== -1) {
      labels.value.splice(index, 1);
    }
    if (selectedLabelId.value === labelId) {
      selectedLabelId.value = null;
    }
  }

  function getNextColor(): string {
    const usedColors = new Set(labels.value.map(l => l.color));
    const availableColor = LABEL_COLORS.find(c => !usedColors.has(c));
    return availableColor ?? LABEL_COLORS[labels.value.length % LABEL_COLORS.length];
  }

  function createLocalLabel(name: string, color?: string): ILabel {
    const label: ILabel = {
      id: uuidv4(),
      name,
      color: color ?? getNextColor(),
      userId: "", // Will be set by backend
      createdAt: new Date().toISOString(),
    };
    return label;
  }

  function getLabelById(labelId: string): ILabel | undefined {
    return labels.value.find(l => l.id === labelId);
  }

  function getLabelsByIds(labelIds: string[]): ILabel[] {
    return labels.value.filter(l => labelIds.includes(l.id));
  }

  function reset(): void {
    labels.value = [];
    selectedLabelId.value = null;
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    labels,
    selectedLabelId,
    isLoading,
    error,

    // Computed
    selectedLabel,
    hasLabels,
    sortedLabels,

    // Actions
    setSelectedLabel,
    loadLabels,
    setLoading,
    setError,
    addLabel,
    updateLabel,
    removeLabel,
    getNextColor,
    createLocalLabel,
    getLabelById,
    getLabelsByIds,
    reset,
  };
});
