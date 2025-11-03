<template>
  <div v-if="!processing" class="qa-pa-md row items-start action-items-container">
    <q-list style="width: 100%">
      <q-item
        class="action-item q-pa-sm"
        clickable
        v-ripple
      >
        <q-item-section avatar>
          <q-icon name="sym_r_refresh" />
        </q-item-section>
        <q-item-section>Refresh</q-item-section>
        <q-menu class="actions-menu" v-model="menus.refresh" anchor="top right" self="top left">
          <q-list>
            <q-item
              v-for="action in getActionsByCategory('refresh')"
              :key="action.title"
              clickable
              v-ripple
              @click="handleActionClick({ item: { data: action.data } })"
            >
              <q-item-section>{{ action.description }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>

      <q-item
        class="action-item q-pa-sm"
        clickable
        v-ripple
      >
        <q-item-section avatar>
          <q-icon name="sym_r_arrow_circle_up" />
        </q-item-section>
        <q-item-section>Update</q-item-section>
        <q-menu class="actions-menu" v-model="menus.update" anchor="top right" self="top left">
          <q-list>
            <q-item
              v-for="action in getActionsByCategory('update')"
              :key="action.title"
              clickable
              v-ripple
              @click="handleActionClick({ item: { data: action.data } })"
            >
              <q-item-section>{{ action.description }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>

      <q-item
        class="action-item q-pa-sm"
        clickable
        v-ripple
      >
        <q-item-section avatar>
          <q-icon name="sym_r_check_circle" />
        </q-item-section>
        <q-item-section>Close</q-item-section>
        <q-menu class="actions-menu" v-model="menus.close" anchor="top right" self="top left">
          <q-list seperator>
            <q-item
              v-for="action in getActionsByCategory('close')"
              :key="action.title"
              clickable
              v-ripple
              @click="handleActionClick({ item: { data: action.data } })"
            >
              <q-item-section>{{ action.description }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>
    </q-list>
  </div>
  
  <proc-manager-component @processing-complete="handleProcComplete" v-if="processing" />
</template>

<script>
import { ref, computed, reactive, toRefs, onMounted, inject } from "vue";
import { storeToRefs } from 'pinia';
import { useLoadingStore } from "@/stores/loading.store";
import { useStructuresStore } from "@/stores/structures.store";
import { CmdTypes } from "@/types/cmd-types";
import { ActionTypes } from "@/types/action-types";
import { ACTIONS, WORK_ITEM_CHILD_RELATIONSHIPS } from "@/services/actions.service";
import { deepCopy } from "@/services/clone.service";
import ProcManagerComponent from "@/components/ProcManagerComponent.vue";

export default {
  name: "ProjectActionsManagerComponent",
  components: {
    ProcManagerComponent,
  },
  setup() {
    const cmdService = inject("cmdService");
    const navService = inject("navService");

    const structuresStore = useStructuresStore();
    const { simple } = storeToRefs(structuresStore);
    const { init } = structuresStore;

    const loadingStore = useLoadingStore();
    const { loading } = storeToRefs(loadingStore);

    const getIconName = (title) => {
      if (title.toLowerCase().includes("close")) {
        return "sym_r_check_circle";
      } else if (title.toLowerCase().includes("update")) {
        return "sym_r_arrow_circle_up";
      } else if (title.toLowerCase().includes("refresh")) {
        return "sym_r_refresh";
      }
      return "refresh"; // default icon
    };

    const enrichedActionsArr = ACTIONS.map((a) => ({
      title: a.title,
      color: a.color,
      description: a.description,
      actions: [
        {
          evtId: "action-click",
          btnIcon: getIconName(a.title),
        }
      ],
      data: a,
    }));
  
    const enrichedActions = ref(enrichedActionsArr);

    const processing = ref(false);
    const isNew = computed(() => navService.isNew);

    const data = reactive({
      loading,
      enrichedActions,
      processing,
      isNew,
    });

    const menus = reactive({
      refresh: false,
      update: false,
      close: false,
    });

    const mapUpdatePercCmds = (items) => {
      const cmds = items.map(i => ({
        projId: "default",
        cmdType: CmdTypes.UPDATE_UNIT_OF_WORK,
        cmdData: {
          cmd: {
            id: i.id,
            complete: Math.ceil(i.perc_complete),
            history: `(Automated) updating percentage complete to ${i.perc_complete}%`
          }
        }
      }));

      return cmds;
    };

    const mapCloseCmds = (items) => {
      const cmds = items.map(i => ({
        projId: "default",
        cmdType: CmdTypes.UPDATE_UNIT_OF_WORK,
        cmdData: {
          cmd: {
            id: i.id,
            state: i.state,
          }
        }
      }));

      return cmds;
    }

    const handleUpdatePercAction = async (items) => {
      const cmds = mapUpdatePercCmds(items);
      await exec(cmds);
    };

    const handleCloseStaleAction = async (items) => {
      const cmds = mapCloseCmds(items);
      await exec(cmds);
    }

    function filterUpdatePercNodes(node, output, wiTypes) {
      if (wiTypes.includes(node.type)) {
        output.push(node);
      }

      for (const child of node.children) {
        filterUpdatePercNodes(child, output, wiTypes);
      }
    }

    function filterCloseNodes(tree, toCloseArr, rootNodeType) {

      if (!tree.children || !tree.children.length) return;

      let allChildrenClosed = true;

      for (const child of tree.children) {
        filterCloseNodes(child, toCloseArr, rootNodeType);

        if (child.state !== "Closed") {
          allChildrenClosed = false;
          continue;
        }
      }

      if (allChildrenClosed && tree.state !== "Closed" && tree.type !== "Task") {

        // todo: very inefficient, come back to this...
        if (WORK_ITEM_CHILD_RELATIONSHIPS[rootNodeType].includes(tree.type)) {
          tree.state = "Closed";
          tree.auto_closed = true;
          toCloseArr.push(tree);
        }
      }
    }

    const handleRefreshProjTreeAction = async () => {

      const cmd = {
        projectId: navService.projId,
      };

      processing.value = true;

      await cmdService.publishWorkflowCmd(cmd);
    }

    const handleActionClick = async (e) => {
      if (!e) return;

      if (e.item.data.id === ActionTypes.REFRESH_PROJ_TREE) {
        await handleRefreshProjTreeAction();
        return;
      }

      const nodes = [];

      if (e.item.data.id.startsWith("UPDATE")) {
        filterUpdatePercNodes(simple.value, nodes, [e.item.data.wi_type]);
        await handleUpdatePercAction(nodes);
        return;
      }

      if (e.item.data.id.startsWith("CLOSE")) {
        filterCloseNodes(simple.value, nodes, e.item.data.wi_type);
        await handleCloseStaleAction(nodes);
        return;
      }

      throw Error("Unsupported action...");
    };

    const handleActionAllClick = async (e) => {
      if (!e) return;

      const root = deepCopy(simple.value);

      // update %
      const percNodes = [];
      const wiTypes = ["Programme", "Large Project", "Medium Project"];
      filterUpdatePercNodes(root, percNodes, wiTypes);
      const { cmds: percCmds } = mapUpdatePercCmds(percNodes);

      // close
      const closeNodes = [];
      closeNodes(root, closeNodes, "Epic");
      const { cmds: closeCmds } = mapCloseCmds(closeNodes);

      const cmds = [...percCmds, ...closeCmds];

      await exec(cmds);
    };

    const handleProcComplete = () => {
      processing.value = false;
    };

    const exec = async (cmds) => {

      processing.value = true;

      await cmdService.publishAzdoProxyCmd({ reqs: cmds });
    }

    const getActionsByCategory = (category) => {
      return enrichedActions.value.filter(action => action.title.toLowerCase().includes(category));
    };

    onMounted(async () => {
      await init(navService.projId);
    });

    return {
      ...toRefs(data),
      handleActionAllClick,
      handleActionClick,
      handleProcComplete,
      ActionTypes,
      menus,
      getActionsByCategory
    };
  },
};
</script>


<style>
.float-right {
  float: right;
  margin-bottom: 5px;
  ;
}

.action-items-container {
  width: 100%;
}

.action-item {
  border-radius: 8px;
  font-size: 14px;
  width: 100%;
}

.actions-menu {
  border-radius: 16px;
  border: 3px solid #eef1f4;
}
</style>