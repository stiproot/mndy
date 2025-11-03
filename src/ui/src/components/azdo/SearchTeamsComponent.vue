<template>

  <q-dialog v-model="searching">
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">Search</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <select-team-component @selected="handleSelect" default="" label="Name" optionValue="id"
          optionLabel="name" />
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-input v-model="model" @blur="handleBlur" label="Team Name *" lazy-rules :rules="[(val) => (val && val.length) || 'Team name is required']">
    <template v-slot:before>
      <q-btn flat icon="search" @click="searching = true" />
    </template>
  </q-input>

</template>
<script>
import { ref, watch } from "vue";
import SelectTeamComponent from "@/components/azdo/SelectTeamComponent.vue";
export default {
  name: "SearchTeamsComponent",
  components: {
    SelectTeamComponent,
  },
  props: {
    initVal: {
      type: String,
      required: false
    },
  },
  setup(props, { emit }) {

    const model = ref(props.initVal);
    const searching = ref(false);

    const emitSelectedEvt = () => {
      const safe = model.value || props.default;
      emit("selected", safe);
    };

    const emitBlurredEvt = () => {
      const safe = model.value;
      emit("blurred", safe);
    };

    function handleSelect(item) {
      model.value = item.name;
      searching.value = false;
    }

    function handleBlur(e) {
      if (!e) return;
      emitBlurredEvt();
    }

    watch(() => model.value, (_new, _old) => {
      if (_new === _old) return;
      emitSelectedEvt();
    });

    return {
      model,
      searching,
      handleSelect,
      handleBlur,
    };
  },
};
</script>
<style></style>
