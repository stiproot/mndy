<template>
  <div class="container">
    <div class="content q-pa-md">
      <q-form class="q-gutter-lg q-px-md">
        <q-input 
          v-model="tag" 
          label="Tag *" 
          lazy-rules 
          @blur="handleTagBlur"
          :rules="[tagRule]"
        >
        </q-input>

        <q-expansion-item v-if="tag && showQl" v-model="showQueryPreview" expand-separator bordered label="Query preview"
          caption="">
          <test-query-component v-if="showQl" :ql="ql" />
        </q-expansion-item>

        <q-input v-model="name" label="Name *" lazy-rules :rules="[(val) => (val && val.length) || 'Name is required']" />

        <q-input disable v-model="color" label="Color" lazy-rules>
        </q-input>

        <q-color v-model="color" default-view="palette" :palette="pallete" />
      </q-form>

      <br />

      <div class="button-container q-pa-sm">
        <q-btn unelevated color="secondary" padding="sm lg" label="Cancel" class="full-width" @click="handleCancelClick" />
        <div class="q-mx-sm"></div> 
        <q-btn unelevated color="accent" padding="sm lg" label="Create" :disable="!(isStateValid && isModified)" class="full-width" @click="handleCreateClick" />
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, watch, inject, reactive, toRefs } from "vue";
import { storeToRefs } from 'pinia'
import { useProjectDetailsStore } from "@/stores/project-details.store";
import { isDiff } from "@/services/diff.service";
import { deepCopy } from "@/services/clone.service";
import { colorPallete } from "@/services/color.service";
import TestQueryComponent from "@/components/TestQueryComponent.vue";

export default {
  name: "ProjCreateFromTemplateView",
  components: { TestQueryComponent },
  setup() {
    const cmdService = inject("cmdService");
    const navService = inject("navService");
    const store = useProjectDetailsStore();
    let originalState = {};
    const isModified = ref(false);
    const showQueryPreview = ref(false);
    const showQl = ref(false);
    const pallete = ref(colorPallete);

    const { id, name, tag, color, ql, enrichedQueries, isStateValid, state } = storeToRefs(store);
    const { sync, init } = store;
    const data = reactive({ id, name, tag, color, ql, showQueryPreview, showQl, pallete });

    const tagRule = (val) => {
      if (!val || val.trim().length === 0) {
        return 'Tag is required';
      }
      if (val.includes(',') || val.includes(' ') || val.includes(';')) {
        return 'Only one tag is allowed';
      }
      return true;
    };

    watch(
      state,
      () => {
        isModified.value = isDiff(state.value, originalState);
      }, { deep: true }
    );

    const handleTagBlur = () => {
      if (!tag.value) return;
      if (!name.value) name.value = tag.value;
      showQl.value = true;
    }

    const handleCreateClick = async () => {
      const cmd = {
        projectId: id.value,
      };

      await sync();
      await cmdService.publishWorkflowCmd(cmd);
      navService.goToProjects();
    };

    const handleCancelClick = () => {
      navService.goToProjects();
    };

    async function initState() {
      if (!navService.isNew) showQl.value = true;
      await init(navService.projId);
      originalState = deepCopy(state.value);
    }

    onMounted(async () => {
      await initState();
    })

    return {
      ...toRefs(data),
      enrichedQueries,
      isStateValid,
      isModified,
      handleTagBlur,
      handleCreateClick,
      handleCancelClick,
      tagRule,
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

.create-template-container {
  background-color: white;
  padding: 16px;
  border-radius: 16px;
  position: relative;
}

.button-container {
  display: flex;
  justify-content: space-between;
}
</style>