<template>
  <div class="text-h4 q-mb-md">Initiative</div>
  <div class="q-pa-md">
    <q-form class="q-gutter-md">
      <q-input
        v-model="title"
        label="Title *"
        lazy-rules
        :rules="[(val) => (val && val.length) || 'Title is required']"
      />

      <q-input
        v-model="tag"
        label="Tag *"
        lazy-rules
        :rules="[(val) => (val && val.length) || 'Tag is required']"
      />

      <q-input
        v-model="desc"
        label="Description *"
        :rules="[(val) => (val && val.length) || 'Description is required']"
      />
    </q-form>
  </div>

  <btn-component
    class="float-right"
    icon="save"
    v-if="isValid"
    @click="handleCreateClick"
  />
</template>
<script>
import { computed, onMounted, reactive, toRefs, ref } from "vue";
import BtnComponent from "./BtnComponent.vue";
export default {
  name: "InitiativeComponent",
  components: {
    BtnComponent,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  setup(props, { emit }) {
    const { title, tag, desc } = ref(props.value);

    const data = reactive({
      title,
      tag,
      desc,
    });

    const isValid = computed(() => {
      return (
        data.title &&
        data.tag &&
        data.desc &&
        data.title.length > 0 &&
        data.tag.length > 0 &&
        data.desc.length > 0
      );
    });

    const emitEvent = () => {
      emit("updated", {
        ...data,
      });
    };

    const handleCreateClick = () => {
      emitEvent();
    };

    onMounted(async () => {
      // // console.log("InitiativeComponent mounted", props.value);
    });

    return {
      ...toRefs(data),
      handleCreateClick,
      isValid,
    };
  },
};
</script>
<style>
.float-right {
  float: right;
}
</style>
