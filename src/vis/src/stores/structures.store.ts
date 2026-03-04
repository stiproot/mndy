import { computed, inject, ref } from "vue";
import { defineStore } from "pinia";
import { QryService } from "@/services/qry.service";
import { IUnit } from "@/types/i-unit";
import { IItem } from "@/types/i-item";

export interface IStructureState {
  tree: any;
}

const UNIT_TREE_STRUCT_ID = "unit_tree";

const notNullAndNotUndefined = (val: any) => val !== null && val !== undefined;

export const useStructuresStore = defineStore("structures-store", () => {

  const DEFAULT_COLOR = "#3279a8";
  const qryService: QryService | undefined = inject("qryService");

  const tree = ref<IStructureState['tree']>(null);

  const isInitialized = computed(() =>
    notNullAndNotUndefined(tree.value)
  );

  const structures = computed(() => [
    { id: "unit_tree", display: "Unit of work tree", structure: tree.value },
  ]);

  const enrichedStructures = computed(() =>
    structures.value.map((i) => ({
      title: i.display,
      color: DEFAULT_COLOR,
      description: `Build ${i.display || i.id}`,
      actions: [
        {
          evtId: "item-click",
          btnIcon: "visibility",
          tooltip: "View"
        },
        // {
        //   evtId: "refresh-click",
        //   btnIcon: "refresh",
        //   tooltip: "Run"
        // },
      ],
      data: i,
    } as IItem<any>)
    ));

  async function initThen(id: string, callback: () => void) {
    if (isInitialized.value) {
      callback();
      return;
    }
    await Promise.all([init(id)]).then(callback);
  }

  async function init(projId: string) {
    const resp = await qryService!.getStructQry({ projId: projId, structType: UNIT_TREE_STRUCT_ID });
    tree.value = resp;
  }

  function flattenTreeRecurs(node: IUnit, flattenedTree: IUnit[]): void {
    for (const c of node.children) {
      flattenedTree.push(c);
      flattenTreeRecurs(c, flattenedTree);
    }
  }

  function flattenTree(): IUnit[] {
    const flattenedTree: IUnit[] = [];
    const root = tree.value.children[0];
    root.parent_id = "";
    flattenedTree.push(root);
    flattenTreeRecurs(root, flattenedTree);
    return flattenedTree;
  }

  function rootNode(): IUnit {
    const root = tree.value.children[0];
    root.parent_id = "";
    return root;
  }

  return {
    tree,
    isInitialized,
    structures,
    enrichedStructures,
    initThen,
    init,
    flattenTree,
    rootNode
  };

});