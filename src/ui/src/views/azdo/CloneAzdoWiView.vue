<template>
  <div class="container">
    <div class="content" v-if="!processing">
      <q-form class="q-gutter-lg q-px-md" v-if="!isExpanded">
        <q-input v-model="id" label="ID *" lazy-rules :rules="[(val) => (val && val.length) || 'ID is required']" />

        <q-input v-model="parentId" label="New Parent ID *" lazy-rules
          :rules="[(val) => (val && val.length) || 'Parent ID is required']" />

        <q-input v-model="iterationPath" label="Iteration Path *" lazy-rules
          :rules="[(val) => (val && val.length) || 'Iteration path is required']" />

        <q-input v-model="areaPath" label="Area Path *" lazy-rules
          :rules="[(val) => (val && val.length) || 'Area path is required']" />

        <q-input v-model="tags" label="Additional Tags" lazy-rules />
      </q-form>

      <br />

      <q-expansion-item v-if="!processing" expand-separator v-model="isExpanded" icon="code" label="Payload">
        <q-expansion-item-content>
          <q-input v-model="clonePayload" label="Clone Work Item Payload*" lazy-rules type="textarea"
            @blur="handlePayloadBlur" :rules="[(val) => (val && val.length) || 'Required']" />
        </q-expansion-item-content>
      </q-expansion-item>

      <br />

      <div class="button-container q-pa-sm">
        <q-btn unelevated color="accent" class="apply-button" padding="sm lg" label="Apply" :disable="!canClone" @click="handleCloneClick" />
      </div>
    </div>
  </div>

  <proc-manager-component @processing-complete="handleProcComplete" v-if="processing" />
</template>

<script>
import { computed, reactive, toRefs, ref, watch, inject } from "vue";
import { CmdTypes } from "@/types/cmd-types";
import { useCloneAzdoWiStore } from "@/stores/clone-azdo-wi.store";
import { storeToRefs } from 'pinia'
import ProcManagerComponent from "@/components/ProcManagerComponent.vue";

export default {
  name: "CloneAzdoWiView",
  components: {
    ProcManagerComponent,
  },
  setup() {
    const cmdService = inject("cmdService");
    const qryService = inject("qryService");
    const store = useCloneAzdoWiStore();
    const {
      id,
      parentId,
      iterationPath,
      areaPath,
      tags,
      isValidState,
    } = storeToRefs(store);
    const { init } = store;

    const clonePayload = ref("");
    const processing = ref(false);
    const canClone = computed(() => isValidState);
    const isExpanded = ref(false);

    const data = reactive({
      id,
      parentId,
      iterationPath,
      areaPath,
      tags,
      clonePayload,
      processing,
      canClone,
    });

    watch(
      () => parentId.value,
      async (newVal) => {
        if (!newVal) return;

        const wi = await qryService.getWiDetails(newVal);
        if (wi) {
          iterationPath.value = wi.fields["System.IterationPath"];
          areaPath.value = wi.fields["System.AreaPath"];
        }
      }
    );

    const handlePayloadBlur = () => {
      if (!clonePayload.value) return;

      const payload = JSON.parse(clonePayload.value);
      init(payload);
      clonePayload.value = "";
      isExpanded.value = false;
    };

    const handleCloneClick = async (e) => {
      if (!e) return;

      const cmd = {
        cmdType: CmdTypes.CLONE_UNIT_OF_WORK,
        cmdData: {
          cmd: {
            id: id.value,
            parentId: parentId.value,
            iterationPath: iterationPath.value,
            areaPath: areaPath.value,
            tags: tags.value
          }
        },
      };

      await cmdService.publishAzdoProxyCmd({ reqs: [cmd] });

      processing.value = true;
    }

    const handleProcComplete = () => {
      clonePayload.value = "";
      processing.value = false;
      init();
    };

    return {
      ...toRefs(data),
      isExpanded,
      handlePayloadBlur,
      handleCloneClick,
      handleProcComplete,
    };
  },
};
</script>
<style scoped>
.container {
  padding: 16px 16px 16px 0;
}

.content {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 16px;
  padding: 16px;
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