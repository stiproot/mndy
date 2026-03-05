<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="custom-card">
      <q-card-section class="row items-center justify-center">
        <div class="text-h5 text-weight-bold">Create New Project</div>
        <q-btn flat round dense icon="close" v-close-popup class="close-btn" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-lg q-px-md">
          <q-input v-model="tag" label="Tags *" lazy-rules @keyup="handleTagChange"
            :rules="[tagRule]">
          </q-input>

          <q-expansion-item v-if="tag && showQl" v-model="showQueryPreview" expand-separator bordered label="Query preview"
            caption="">
            <test-query-component v-if="showQl" :ql="ql" />
          </q-expansion-item>
        </q-form>
      </q-card-section>

      <q-card-section>
        <div class="button-container">
          <q-btn unelevated color="secondary" padding="sm lg" label="Cancel" class="full-width" @click="handleCancelClick" />
          <div class="q-mx-sm"></div> 
          <q-btn unelevated color="accent" padding="sm lg" label="Create" :disable="!isStateValid" class="full-width" @click="handleCreateClick" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, watch, inject, reactive, toRefs, computed } from "vue";
import { storeToRefs } from 'pinia';
import { useProjectDetailsStore } from "@/stores/project-details.store";
import { isDiff } from "@/services/diff.service";
import TestQueryComponent from "@/components/TestQueryComponent.vue";

export default {
  name: "CreateNewProjectFromTagModalComponent",
  components: { TestQueryComponent },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue", "projectCreated"],
  setup(props, { emit }) {
    const navService = inject("navService");
    const store = useProjectDetailsStore();
    let originalState = {};
    const isModified = ref(false);
    const showQueryPreview = ref(false);
    const showQl = ref(false);

    const { id, name, tag, color, ql, enrichedQueries, isStateValid, state } = storeToRefs(store);
    const { sync, init } = store;
    const data = reactive({ id, name, tag, color, ql, showQueryPreview, showQl });

    const isOpen = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emit("update:modelValue", value);
      },
    });

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

    const handleTagChange = () => {
      if (!tag.value) return;
      showQl.value = true;
      name.value = tag.value;
    };

    const handleCreateClick = async () => {
      if (!isStateValid.value) {
        console.warn("Invalid state", state.value);
        return;
      }

      name.value = tag.value;
      await sync();

      emit("projectCreated");

      isOpen.value = false;
      await init();

      navService.goToProjects();
    };

    const handleCancelClick = async () => {
      navService.goToProjects();
      isOpen.value = false;
      await init();
    };

    return {
      ...toRefs(data),
      enrichedQueries,
      isStateValid,
      isModified,
      isOpen,
      handleTagChange,
      handleCreateClick,
      handleCancelClick,
      tagRule
    };
  },
};
</script>

<style scoped>
.custom-card {
  max-width: 400px;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0px 8px 16px 0px #00000014, 0px 0px 4px 0px #0000000A;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.full-width {
  width: 48%;
}

.button-container {
  display: flex;
  justify-content: space-between;
}
</style>