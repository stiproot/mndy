<template>
  <div></div>
</template>
<script>
import { onMounted, inject } from "vue";
import { storeToRefs } from "pinia";
import { useLoadingStore } from "@/stores/loading.store";

export default {
  name: "AuthCallbackView",
  setup() {

    const navService = inject("navService");
    const authService = inject("authService");
    const loadingStore = useLoadingStore();
    const { circLoading } = storeToRefs(loadingStore);

    async function initState() {
      circLoading.value = true;
      setTimeout(async () => {
        await authService.login();
        circLoading.value = false;
        navService.goToProjects();
      }, 500);
    }

    onMounted(async () => {
      await initState();
    })

    return { };
  },
};
</script>
<style></style>
