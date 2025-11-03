<template>
  <q-dialog v-model="searching">
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">Search</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <infinite-scroll-component
          @selected="handleQuerySelect"
          default=""
          v-model="model"
          label="Name"
          optionValue="id"
          optionLabel="name"
        />
      </q-card-section>
    </q-card>
  </q-dialog>

  <div class="q-pa-md">
    <q-form class="q-gutter-md">
      <q-input
        v-model="name"
        label="Name *"
        lazy-rules
        :rules="[(val) => (val && val.length) || 'Name is required']"
      >
        <template v-slot:after>
          <q-btn
            round
            color="primary"
            icon="search"
            @click="searching = true"
          />
        </template>
      </q-input>

      <q-input
        v-model="ql"
        label="WIQL *"
        lazy-rules
        type="textarea"
        :rules="[(val) => (val && val.length) || 'WIQL is required']"
      />

      <q-input
        v-model="tags"
        label="Tags (semi-colon separated)"
        lazy-rules
        @blur="handleTagsBlur"
      />

      <q-input
        v-model="ids"
        label="Ids (semi-colon separated)"
        lazy-rules
        @blur="handleIdsBlur"
      />

      <btn-component icon="expand_more" @click="handleTestClick" />
    </q-form>
  </div>

  <div class="q-pa-md">
    <div v-if="rows && rows.length === 0">
      <div>Nothing found.</div>
    </div>

    <div v-if="rows && rows.length">
      <q-expansion-item
        v-model="isResultsExpanded"
        expand-separator
        label="Results"
        caption=""
      >
        <q-card bordered>
          <q-table
            title="Work Items"
            :rows="rows"
            :columns="columns"
            row-key="id"
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="id" :props="props">
                  {{ props.row.id }}
                </q-td>
                <q-td key="url" :props="props">
                  <a :href="props.row.url" target="_blank">
                    {{ props.row.url }}</a
                  >
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card>
      </q-expansion-item>
    </div>

  <q-btn-group push class="float-right">
    <btn-component v-if="isStateValid" icon="check" @click="handleSaveClick" />
    <btn-component icon="close" @click="handleCloseClick" />
  </q-btn-group>

  </div>

  <slot />
</template>
<script>
import { ref, reactive, toRefs } from "vue";
import { useQueryStore } from "@/stores/query.store";
import { runWiql } from "@/services/azdo.service";
import BtnComponent from "./BtnComponent.vue";
import InfiniteScrollComponent from "./InfiniteScrollComponent.vue";
import { storeToRefs } from 'pinia'

export default {
  name: "QueryComponent",
  components: { BtnComponent, InfiniteScrollComponent },
  props: {
    item: {
      type: Object,
      default: () => null,
    },
  },
  setup(props, { emit }) {
    const store = useQueryStore();
    const { name, ql, isStateValid } = storeToRefs(store);

    const rows = ref(null);
    const tags = ref(null);
    const ids = ref(null);
    const searching = ref(false);
    const isResultsExpanded = ref(false);

    const data = reactive({
      name,
      ql,
      isStateValid,
      tags,
      searching,
      ids,
      isResultsExpanded,
    });

    const clearTags = () => {
      tags.value = "";
    };

    const handleTagsBlur = async () => {
      if (!tags.value || !tags.value.length) {
        return;
      }

      const tagsArr = tags.value.split(";");
      const idsArr = extractIdsFromQl();
      const idsPred = buildIdsPredicate(idsArr);
      const tagsPred = buildTagsPredicate(tagsArr);
      const wiql = buildWiql(tagsPred, idsPred);

      ql.value = wiql;
      name.value = buildQryName(tagsArr);
    };

    const buildTagsPredicate = (tags) => {
      if (!tags || !tags.length) return null;
      const pred = tags
        .map((t) => `[System.Tags] CONTAINS '${t}'`)
        .join(" AND ");
      return pred;
    };

    const buildIdsPredicate = (ids) => {
      if (!ids || !ids.length) return null;
      const pred = `(${ids.map((t) => `[System.Id] = ${t}`).join(" OR ")})`;
      return pred;
    };

    const buildQryName = (tags) => tags.join("_");

    const extractTagsFromQl = () => {
      if (!ql.value) return [];

      const tagsRe = /\[System\.Tags\]\s+CONTAINS\s+'([^']+)'/g;
      const tagValueRe = /(?<=\[System\.Tags\] CONTAINS ').+(?=')/g;

      const systemTagsContains = ql.value.match(tagsRe);
      const tagsArr = systemTagsContains
        .map((m) => m.match(tagValueRe))
        .map((m) => m[0]);

      return tagsArr;
    };

    const extractIdsFromQl = () => {
      if (!ql.value) return [];

      const idsRe = /\[System\.Id\]\s+[=]\s\d+/g;
      const idValRe = /\d+/;

      const systemIdEquals = ql.value.match(idsRe);
      if (!systemIdEquals) return [];

      const idsArr = systemIdEquals
        .map((m) => m.match(idValRe))
        .map((m) => m[0]);

      return idsArr;
    };

    const buildWiql = (tagsPred, idsPred) => {
      let wiql =
        `SELECT ` +
        `[System.Id], ` +
        `[System.WorkItemType], ` +
        `[System.Title], ` +
        `[System.AssignedTo], ` +
        `[System.State], ` +
        `[System.Tags]  ` +
        `FROM WorkItems WHERE `;

      if (idsPred && !tagsPred) wiql += `${idsPred}`;
      if (tagsPred && !idsPred) wiql += `${tagsPred}`;
      if (idsPred && tagsPred) wiql += `${tagsPred} AND ${idsPred}`;

      return wiql;
    };

    const handleIdsBlur = async () => {
      if (!ids.value || !ids.value.length) {
        return;
      }

      const tagsArr = extractTagsFromQl();
      const tagsPred = buildTagsPredicate(tagsArr);

      let idArr = ids.value.split(";");
      const idsFromQl = extractIdsFromQl();

      idsFromQl.forEach((i) => {
        if (!idArr.includes(i)) idArr.push(i);
      });

      const idsPred = buildIdsPredicate(idArr);

      ql.value = buildWiql(tagsPred, idsPred);
      name.value = buildQryName(tagsArr);
    };

    const handleTestClick = async () => {
      const resp = await runWiql(data.ql);
      if (resp) {
        rows.value = resp.workItems;
        isResultsExpanded.value = rows.value.length > 0;
      } else {
        rows.value = [];
      }
    };

    const handleQuerySelect = (item) => {
      if (!item || item === "") {
        return;
      }
      name.value = item.name;
      ql.value = item.wiql;
      searching.value = false;
      clearTags();
    };

    const handleSaveClick = () => {
      emit("select-query", { name: name.value, ql: ql.value })
    };

    const handleCloseClick = () => {
      emit("close", { })
    };

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

    return {
      ...toRefs(data),
      handleTagsBlur,
      handleTestClick,
      handleQuerySelect,
      handleSaveClick,
      handleCloseClick,
      handleIdsBlur,
      clearTags,
      columns,
      rows,
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
  float:right;
  margin-bottom: 5px;
}
</style>
