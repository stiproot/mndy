<template>
  <div class="text-h4 q-mb-md">{{ title }}</div>
  <div class="q-pa-md">
    <q-list bordered separator>
      <q-item clickable v-ripple :active="active" v-for="i in blueprints" :key="i.id" :item="i">
        <q-item-section>
          <q-item-label>{{ i.cmd_type }}</q-item-label>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ i.proc_status }}</q-item-label>
        </q-item-section>
        <q-item-section avatar side v-if="i.proc_status !== statuses.RUNNING">
          <q-icon color="grey" v-if="i.proc_status === statuses.PENDING" name="pending" />
          <q-icon color="green" v-if="i.proc_status === statuses.COMPLETE" name="check_small" />
          <q-icon color="red" v-if="i.proc_status === statuses.ERROR" name="warning" />
        </q-item-section>
        <q-item-section side v-if="i.proc_status === statuses.RUNNING">
          <q-circular-progress indeterminate size="30px" :thickness="0.3" color="lime" center-color="grey-8"
            class="q-mt-sm" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>
<script>
import { ref } from "vue";
import { ProcStatuses } from "@/types/proc-statuses";
export default {
  name: "ProcComponent",
  props: {
    blueprints: {
      type: Array,
      default: () => [],
    },
    title: {
      type: String,
      default: "Processes",
    },
  },
  setup() {
    const statuses = ref(ProcStatuses);
    return {
      statuses,
    };
  },
};
</script>
<style scoped></style>