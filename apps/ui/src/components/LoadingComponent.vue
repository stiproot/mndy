<template>
  <q-ajax-bar
    ref="bar"
    position="top"
    color="accent"
    size="10px"
    skip-hijack
  />
</template>
<script>
import { ref, watch, reactive } from "vue";
import { useLoadingStore } from "@/stores/loading.store";
import { storeToRefs } from 'pinia'
export default {
  name: "LoadingComponent",
  setup() {
    const store = useLoadingStore();
    const { loading } = storeToRefs(store);
    const data = reactive({ loading });
    const barTimoutMs = 1000;
    const bar = ref(null);

    watch(
      () => data.loading,
      (_new, _old) => {
        if (_new === _old) return;
        const barRef = bar.value;
        if (_new) {
          barRef.start();
          setTimeout(() => {
            data.loading = false;
          }, barTimoutMs);
        } else barRef.stop();
      }
    );

    return { bar };
  },
};
</script>

<style scoped></style>
