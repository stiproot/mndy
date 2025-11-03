<template>

  <q-dialog v-model="searching">
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">Search</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <select-iteration-component @selected="handleIterationSelect" default="" label="Iterations" optionValue="id"
          optionLabel="name" :team-name="teamName" />
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-input v-model="model" label="Iteration Path *" lazy-rules :rules="[(val) => (val && val.length) || 'Iteration path is required']">
    <template v-slot:before>
      <q-btn flat icon="search" @click="searching = true" />
    </template>
  </q-input>

</template>
<script>
import { ref, watch } from "vue";
import SelectIterationComponent from "@/components/azdo/SelectIterationComponent.vue";
export default {
  name: "SearchIterationsComponent",
  components: {
    SelectIterationComponent,
  },
  props: {
    initVal: {
      type: String,
      required: false
    },
    teamName: {
      type: String,
      required: true
    },
  },
  setup(props, { emit }) {

    const model = ref(props.initVal);
    const searching = ref(false);

    const emitEvt = () => {
      const safe = model.value || props.default;
      emit("selected", safe);
    };

    watch(() => model.value, (_new, _old) => {
      if (_new === _old) return;
      emitEvt();
    })

    function handleIterationSelect(item) {
      model.value = item.path;
      searching.value = false;
    }

    return {
      model,
      searching,
      handleIterationSelect,
    };
  },
};
</script>
<style></style>
