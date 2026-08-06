<template>
  <q-select clearable use-input v-model="model" input-debounce="300" :label="label" :options="options"
    :option-label="`${optionLabel}`" @filter="filterFn">
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>
<script>
import { ref, watch, inject } from "vue";
export default {
  name: "InfiniteScrollComponent",
  props: {
    label: String,
    optionValue: String,
    optionLabel: String,
    default: Object,
  },
  setup(props, { emit }) {

    const qryService = inject("qryService");

    const options = ref([]);
    const model = ref();

    const emitEvent = () => {
      const safe = model.value || props.default;
      emit("selected", safe);
    };

    watch(
      () => model.value,
      () => emitEvent()
    );

    async function filterFn(val, update) {
      if (val.length < 3) {
        return;
      }

      const res = await qryService.filterQueries(val);
      options.value = res;
      update(() => {
        options.value = res;
      });
    }

    return {
      model,
      options,
      filterFn,
    };
  },
};
</script>
<style></style>
