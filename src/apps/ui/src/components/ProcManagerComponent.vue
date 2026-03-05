<template>
  <proc-component :blueprints="procs" :title="title" />
</template>
<script>
import { onMounted, reactive, toRefs, ref, inject } from "vue";
import { useProcessStore } from "@/stores/proc.store";
import ProcComponent from "@/components/ProcComponent.vue";
import { storeToRefs } from 'pinia'
export default {
  name: "ProcManagerComponent",
  components: {
    ProcComponent
  },
  props: {
    title: {
      type: String,
      default: "Processes",
    },
  },
  setup(props, { emit }) {
    const navService = inject("navService");
    const INTERVAL_TIMEOUT_MS = 2 * 1000;
    const EXIT_TIMEOUT_MS = 2.5 * 1000;
    const TOTAL_TIMEOUT_MS = 15 * 1000;

    const title = ref(props.title);
    const store = useProcessStore();
    const { procs, isStillRunning } = storeToRefs(store);
    const { refresh } = store;

    const data = reactive({
      procs,
      isStillRunning,
      title
    });

    let runningTimeMs = 0;

    const initInterval = () => {

      runningTimeMs = 0;

      let intervalId = setInterval(async () => {
        if (isStillRunning.value && runningTimeMs <= TOTAL_TIMEOUT_MS) {
          await refresh(navService.projId || "default");
          runningTimeMs += INTERVAL_TIMEOUT_MS;
        } else {
          clearInterval(intervalId);
          setTimeout(() => {
            handleProcComplete();
          }, EXIT_TIMEOUT_MS);
        }
      }, INTERVAL_TIMEOUT_MS);
    };

    const handleProcComplete = () => {
      emitCompleteEvent();
    };

    function emitCompleteEvent() {
      emit("processing-complete", {});
    }

    const initState = async () => {
      setTimeout(async () => {
        await refresh(navService.projId || "default");
        initInterval();
      }, 1250);
    };

    onMounted(async () => {
      initState();
    });

    return {
      ...toRefs(data),
    };
  },
};
</script>
<style scoped></style>
