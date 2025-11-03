<template>
  <q-range
    markers
    marker-labels
    v-model="model"
    :min="minVal"
    :max="maxVal"
    :step="stepVal"
    :disable="disabled"
  />
</template>
<script>
import { ref, watch } from "vue";
export default {
  name: "RangeFilterComponent",
  props: { minVal: Number, maxVal: Number, stepVal: Number, disabled: Boolean },
  setup(props, { emit }) {
    const model = ref({ min: props.minVal, max: props.maxVal });

    const emitEvent = () => {
      emit("adjusted", model.value);
    };

    watch(
      () => model.value,
      () => emitEvent()
    );

    return {
      model,
    };
  },
};
</script>
<style></style>
