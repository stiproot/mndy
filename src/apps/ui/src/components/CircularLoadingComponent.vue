<template>
  <div v-if="circLoading" class="circ-pos">
    <q-circular-progress indeterminate rounded size="75px" color="primary" />
  </div>
</template>
<script>
import { watch } from "vue";
import { storeToRefs } from 'pinia'
import { useLoadingStore } from "@/stores/loading.store";
export default {
  name: "CircularLoadingComponent",
  setup() {
    const TIMEOUT_MS = 4500;
    const store = useLoadingStore();
    const { circLoading } = storeToRefs(store);

    watch(
      () => circLoading.value,
      (_new, _old) => {
        if (_new === _old) return;
        if (_new) {
          setTimeout(() => {
            circLoading.value = false;
          }, TIMEOUT_MS);
        }
      }
    );

    return { circLoading };
  },
};
</script>

<style scoped>
.circ-pos {
  position: absolute;
  top: 48%;
  left: 50%;
  z-index: 1
}
</style>
