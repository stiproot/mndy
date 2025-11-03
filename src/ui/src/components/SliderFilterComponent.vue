<template>
  <q-slider
    v-model="model"
    markers
    marker-labels
    :step="stepVal"
    :min="minVal"
    :max="maxVal"
  />
</template>
<script>
import { ref, watch } from "vue";
export default {
  name: "SliderFilterComponent",
  props: { minVal: Number, maxVal: Number, stepVal: Number },
  setup(props, { emit }) {
    const model = ref(0);

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
