<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="custom-card">
      <q-card-section class="row items-center justify-center">
        <div class="text-h5 text-weight-bold">Create New Project</div>
        <q-btn flat round dense icon="close" v-close-popup class="close-btn" />
      </q-card-section>

      <q-card-section class="q-pa-md">
        <div class="row justify-around q-mb-md">
          <div class="column items-center">
            <q-btn flat class="custom-btn custom-btn-dashed" @click="handleTemplateClick">
              <q-icon size="lg" name="sym_r_add" class="custom-icon" />
            </q-btn>
            <div class="text-subtitle1 q-mt-md">Use a template</div>
            <div class="text-caption">Create from template</div>
          </div>
          <div class="column items-center">
            <q-btn flat class="custom-btn custom-btn-solid" @click="handleTagClick">
              <q-icon size="md" name="fa-solid fa-tag" class="custom-icon" />
            </q-btn>
            <div class="text-subtitle1 q-mt-md">Use a tag</div>
            <div class="text-caption">Create from existing tag</div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { inject, computed } from 'vue';

export default {
  name: "CreateNewProjectModalComponent",
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue", "create-template", "create-tag"],
  setup(props, { emit }) {
    const navService = inject("navService");

    const isOpen = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emit("update:modelValue", value);
      },
    });

    const handleTemplateClick = () => {
      navService.goToCreateProjectFromTemplate();
      isOpen.value = false;
    };

    const handleTagClick = () => {
      emit("create-from-tag");
      isOpen.value = false;
    };

    return {
      isOpen,
      handleTemplateClick,
      handleTagClick,
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

.custom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 24px;
  margin: 0 8px;
  border-color: #9BA5B7;
}

.custom-btn-dashed {
  border: 3px dashed #9BA5B7;
}

.custom-btn-solid {
  border: 3px solid #9BA5B7;
}

.custom-icon {
  color: #9BA5B7;
}

.q-mt-md {
  margin-top: 14px;
}
</style>