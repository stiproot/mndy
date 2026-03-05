<template>
  <div class="container">
    <div class="content" v-if="!processing">
      <q-form class="q-gutter-md q-px-md">
        <q-input v-model="id" label="ID *" lazy-rules :rules="[(val) => (val && val.length) || 'Root ID is required']" />

        <q-input v-model="tags" label="Tags *" lazy-rules
          :rules="[(val) => (val && val.length) || 'Tags are required']" />

      </q-form>

      <br />

      <div class="button-container q-pa-sm">
        <q-btn unelevated color="accent" padding="sm lg" label="Update" :disable="!canProcess" @click="handleProcessClick" />
      </div>
    </div>
  </div>

  <proc-manager-component @processing-complete="handleProcComplete" v-if="processing" />
</template>
<script>
import { computed, reactive, toRefs, ref, inject } from "vue";
import { CmdTypes } from "@/types/cmd-types";
import ProcManagerComponent from "@/components/ProcManagerComponent.vue";

export default {
  name: "UpdateAzdoWiView",
  components: {
    ProcManagerComponent,
  },
  setup() {
    const cmdService = inject("cmdService");

    const processing = ref(false);
    const id = ref(null);
    const tags = ref(null);
    const canProcess = computed(() => id.value && tags.value);

    const data = reactive({
      id,
      tags,
      processing,
      canProcess,
    });

    const mapCmds = () => {
      const cmds = [{ id: id.value, tags: tags.value }].map(p => ({
        cmdType: CmdTypes.UPDATE_UNIT_OF_WORK_HIERARCHY,
        cmdData: {
          cmd: {
            id: p.id,
            tags: p.tags.split(";").map(t => t.trim()).join(';'),
          }
        }
      }));

      return cmds;
    };

    const handleProcComplete = () => {
      initState();
      processing.value = false;
    };

    const exec = async (cmds) => {
      await cmdService.publishAzdoProxyCmd({ reqs: cmds });
      processing.value = true;
    }

    const handleProcessClick = async () => {
      const cmds = mapCmds();
      await exec(cmds);
    };

    const initState = () => {
      id.value = null;
      tags.value = null;
    }

    return {
      ...toRefs(data),
      handleProcessClick,
      handleProcComplete,
    };
  },
};
</script>
<style scoped>
.container {
  padding: 16px 16px 16px 0; /* Adjust as needed */
}

.content {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 16px;
  padding: 16px; /* Adjust as needed */
}

.float-right {
  float: right;
}

.button-container {
  display: flex;
  justify-content: flex-end;
}

.q-expansion-item {
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>