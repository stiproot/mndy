<template>
  <div class="q-pa-md">
    <q-markup-table>
      <thead>
        <tr>
          <th>
            <q-item>
              <q-item-section>
                <div class="toggle-container">
                  <q-toggle
                    v-model="critical"
                    label="Highest Risk"
                    left-label
                    color="red"
                  />
                  <span class="toggle-label">Critical</span>
                </div>
              </q-item-section>
            </q-item>
          </th>
        </tr>
        <tr>
          <th>
            <div class="float-left">
              <q-badge class="larger-font" color="green">{{
                no_greens
              }}</q-badge>
              <q-badge class="larger-font" color="orange">{{
                no_ambers
              }}</q-badge>
              <q-badge class="larger-font" color="red">{{ no_reds }}</q-badge>
              <br />
              Average:
              <q-badge class="larger-font" rounded :color="getColor(avg)">{{
                avg
              }}</q-badge>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="d in dataset" :key="d.id">
          <td class="text-left">
            <q-item clickable tag="a" target="_blank" :href="d.ext_url">
              <q-item-section>
                <q-item-label>{{ d.title }}</q-item-label>
                <q-item-label caption
                  >Risk impact:
                  <q-badge
                    class="larger-font"
                    rounded
                    :color="getColor(d.risk_impact)"
                    >{{ d.risk_impact }}</q-badge
                  >
                </q-item-label>
              </q-item-section>
            </q-item>
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>
<script>
import { watch, onMounted, reactive, toRefs, ref, inject } from "vue";
import { useStructuresStore } from "@/stores/structures.store";
import { getTasks } from "@/fns/tree.fns";
import { getBadgeColor } from "@/services/color.service";
import { storeToRefs } from 'pinia'
export default {
  name: "ListComponent",
  setup() {
    const navService = inject("navService");
    const store = useStructuresStore();
    const { tree, isInitialized } = storeToRefs(store);
    const { initThen } = store;

    const dataset = ref([]);
    const accumFilterFn = ref(null);
    const critical = ref(false);
    const no_greens = ref(0);
    const no_ambers = ref(0);
    const no_reds = ref(0);
    const avg = ref(0);

    const getColor = (v) => getBadgeColor(v);

    const data = reactive({
      dataset,
      critical,
      getColor,
      no_greens,
      no_ambers,
      no_reds,
      avg,
    });

    watch(
      () => accumFilterFn.value,
      () => {
        refreshDataset();
      }
    );

    watch(
      () => critical.value,
      () => {
        accumFilterFn.value = (node) => {
          return node.is_critical === critical.value;
        };
      }
    );

    const filterTasks = (tasks) => {
      if (accumFilterFn.value)
        tasks = tasks.filter((task) => accumFilterFn.value(task));

      const sortedTasks = tasks.sort((a, b) => {
        if (a.risk_impact === b.risk_impact) {
          return b.severity - a.severity;
        } else {
          return b.risk_impact - a.risk_impact;
        }
      });

      const subset = sortedTasks.slice(0, 20);

      return subset;
    };

    const refreshCounts = (d) => {
      const greens = d.filter((t) => t.risk_impact < 15);
      const ambers = d.filter((t) => t.risk_impact >= 15 && t.risk_impact < 40);
      const reds = d.filter((t) => t.risk_impact >= 40);

      no_greens.value = greens.length;
      no_ambers.value = ambers.length;
      no_reds.value = reds.length;

      const count = greens.length + ambers.length + reds.length;
      const sum = d.reduce(
        (acc, currentValue) => acc + currentValue.risk_impact,
        0
      );

      avg.value = count ? (sum / count).toFixed(2) : 0;
    };

    const refreshDataset = () => {
      if (!isInitialized.value) return;

      if (!tree.value) return;

      const tasks = [];
      getTasks(tree.value, tasks);

      const filteredTasks = filterTasks(tasks);

      refreshCounts(filteredTasks);
      dataset.value = filteredTasks;
    };

    onMounted(async () => {
      await initThen(navService.projId, () => {
        refreshDataset();
      });
    });

    return {
      ...toRefs(data),
    };
  },
};
</script>
<style scoped>
.float-right {
  float: right;
}

.larger-font {
  font-size: larger;
}

.toggle-container {
  display: flex;
  align-items: center;
}

.toggle-label {
  margin-left: 7px;
}
</style>
