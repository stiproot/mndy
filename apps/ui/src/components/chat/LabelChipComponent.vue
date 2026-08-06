<template>
  <q-chip
    :size="size"
    :style="{ backgroundColor: labelColor, color: textColor }"
    :removable="removable"
    @remove="$emit('remove')"
  >
    {{ labelName }}
  </q-chip>
</template>

<script>
import { defineComponent, computed } from "vue";
import { useLabelsStore } from "@/stores/labels.store";

export default defineComponent({
  name: "LabelChipComponent",
  props: {
    labelId: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      default: "md",
    },
    removable: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["remove"],
  setup(props) {
    const labelsStore = useLabelsStore();

    const label = computed(() => labelsStore.getLabelById(props.labelId));

    const labelName = computed(() => label.value?.name || "Unknown");

    const labelColor = computed(() => label.value?.color || "#888");

    const textColor = computed(() => {
      // Calculate contrast color
      const color = label.value?.color || "#888";
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? "#000" : "#fff";
    });

    return {
      labelName,
      labelColor,
      textColor,
    };
  },
});
</script>

<style scoped>
.q-chip {
  font-weight: 500;
}
</style>
