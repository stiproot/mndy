<template>
  <q-select
    clearable
    multiple
    filled
    v-model="model"
    :options="options"
    :label="label"
  />
</template>
<script>
import { ref, watch } from "vue";
export default {
  name: "SelectFilterComponent",
  props: { label: String, options: Array },
  setup(props, { emit }) {
    const model = ref(props.options);

    const emitEvent = () => {
      const safe = model.value || [];
      emit("selected", safe);
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
