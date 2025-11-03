<template>

  <div class="q-pa-md">

    <q-form class="q-gutter-md">

      <q-input v-model="tag" label="Tags *" lazy-rules @blur="handleTagBlur"
        :rules="[tagRule]">
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

  </div>

  <fab-action-component>
    <btn-component v-if="isStateValid && isModified" icon="save" @click="handleSaveClick" />
  </fab-action-component>

</template>
<script>
import { onMounted, ref, watch, inject, reactive, toRefs } from "vue";
import { storeToRefs } from 'pinia'
import { useProjectDetailsStore } from "@/stores/project-details.store";
import { isDiff } from "@/services/diff.service";
import { deepCopy } from "@/services/clone.service";
import { colorPallete } from "@/services/color.service";
import FabActionComponent from "@/components/FabActionComponent.vue";
import BtnComponent from "@/components/BtnComponent.vue";
import TestQueryComponent from "@/components/TestQueryComponent.vue";
export default {
  name: "ProjDetailsView",
  components: { FabActionComponent, BtnComponent, TestQueryComponent },
  setup() {
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

    watch(
      state,
      () => {
        isModified.value = isDiff(state.value, originalState);
      }, { deep: true }
    );

    const tagRule = (val) => {
      if (!val || val.trim().length === 0) {
        return 'Tag is required';
      }
      if (val.includes(',') || val.includes(' ') || val.includes(';')) {
        return 'Only one tag is allowed';
      }
      return true;
    };

    const handleTagBlur = () => {
      if (!tag.value) return;
      if (!name.value) name.value = tag.value;
      showQl.value = true;
    }

    const handleSaveClick = async () => {
      await sync();
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
      handleSaveClick,
      tagRule
    };
  },
};
</script>
<style></style>
