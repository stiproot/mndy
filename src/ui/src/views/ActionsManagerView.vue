<template>
  <div v-if="!processing" class="qa-pa-md row items-start q-gutter-md">
    <item-selector-component :items="enrichedActions" @action-click="handleActionClick" />
  </div>

  <br />

  <proc-manager-component @processing-complete="handleProcComplete" v-if="processing" />

</template>
<script>
import { ref, computed, reactive, toRefs, onMounted, inject } from "vue";
import { storeToRefs } from 'pinia'
import { useLoadingStore } from "@/stores/loading.store";
import { useStructuresStore } from "@/stores/structures.store";
import { CmdTypes } from "@/types/cmd-types";
import { ActionTypes } from "@/types/action-types";
import { ACTIONS, WORK_ITEM_CHILD_RELATIONSHIPS } from "@/services/actions.service";
import { deepCopy } from "@/services/clone.service";
import ProcManagerComponent from "@/components/ProcManagerComponent.vue";
import ItemSelectorComponent from "@/components/ItemSelectorComponent.vue";

export default {
  name: "ActionsManagerView",
  components: {
    ItemSelectorComponent,
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

    const enrichedActionsArr = ACTIONS.map((a) => ({
      title: a.title,
      color: a.color,
      description: a.description,
      actions: [
        {
          evtId: "action-click",
          btnIcon: "refresh",
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

    onMounted(async () => {
      await init(navService.projId);
    });

    return {
      ...toRefs(data),
      handleActionAllClick,
      handleActionClick,
      handleProcComplete
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
</style>