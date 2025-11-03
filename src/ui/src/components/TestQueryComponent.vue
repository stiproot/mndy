<template>
  <div class="q-pa-md">
    <q-form class="q-gutter-md">
      <q-input v-model="wiql" label="WIQL" type="textarea" disable readonly outlined />

      <div v-if="rows && rows.length === 0">
        <div>Nothing found.</div>
      </div>

      <q-table v-if="rows && rows.length" title="Work Items" :rows="rows" :columns="columns" row-key="id">
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="id" :props="props">
              {{ props.row.id }}
            </q-td>
            <q-td key="url" :props="props">
              <a :href="props.row.url" target="_blank">
                {{ props.row.url }}</a>
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <div class="q-pa-md">
        <div class="row justify-center">
          <btn-component v-if="rows && rows.length" icon="expand_less" @click="handleCollapseClick" />
          <btn-component v-else icon="expand_more" @click="handleRunClick" />
        </div>
      </div>

    </q-form>
  </div>

  <slot />
</template>
<script>
import { ref, reactive, toRefs, inject } from "vue";
import BtnComponent from "./BtnComponent.vue";

export default {
  name: "TestQueryComponent",
  components: { BtnComponent },
  props: {
    ql: {
      type: String,
      required: true,
    },
  },
  setup(props) {

    const qryService = inject("qryService");

    const wiql = ref(props.ql);
    const rows = ref(null);
    const searching = ref(false);
    const isResultsExpanded = ref(false);
    const columns = ref([
      {
        name: "id",
        required: true,
        label: "Id",
        align: "left",
        field: (row) => row.id,
        format: (val) => `${val}`,
        sortable: true,
      },
      {
        name: "url",
        align: "left",
        label: "Url",
        field: "url",
        sortable: false,
        format: (val) => {
          return this.$slots.linkColumn({ url: val });
        },
      },
    ]);

    const data = reactive({
      wiql,
      rows,
      searching,
      isResultsExpanded,
      columns
    });

    const handleRunClick = async () => {
      const resp = await qryService.runWiql(props.ql);
      if (resp) {
        rows.value = resp.workItems;
        isResultsExpanded.value = rows.value.length > 0;
      } else {
        rows.value = [];
      }
    };

    const handleCollapseClick = async () => {
      rows.value = [];
    };

    return {
      ...toRefs(data),
      handleRunClick,
      handleCollapseClick,
    };
  },
};
</script>
<style scoped>
.q-expansion-item {
  border: 1px solid #ccc;
  border-radius: 5px;
}

.float-right {
  float: right;
  margin-bottom: 5px;
}
</style>
