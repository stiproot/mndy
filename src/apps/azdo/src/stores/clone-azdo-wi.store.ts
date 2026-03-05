import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface ICloneWiCmd {
  id: string | null;
  parentId: string | null;
  iterationPath: string | null;
  areaPath: string | null;
  tags: string | null;
}

const defaultState = () : ICloneWiCmd => ({
  id: null,
  parentId: null,
  iterationPath: null,
  areaPath: null,
  tags: null,
});

export const useCloneAzdoWiStore = defineStore("clone-azdo-wi-store", () => {

  const id = ref<ICloneWiCmd['id']>(null);
  const parentId = ref<ICloneWiCmd['parentId']>(null);
  const iterationPath = ref<ICloneWiCmd['iterationPath']>(null);
  const areaPath = ref<ICloneWiCmd['areaPath']>(null);
  const tags = ref<ICloneWiCmd['tags']>(null);

  const isValidState = computed(() =>
    id.value &&
    parentId.value &&
    iterationPath.value &&
    areaPath.value &&
    tags.value
  );

  function init(data: ICloneWiCmd | undefined) {

    if (!data) data = defaultState();

    id.value = data.id;
    parentId.value = data.parentId;
    iterationPath.value = data.iterationPath;
    areaPath.value = data.areaPath;
    tags.value = data.tags;
  }

  return {
    id,
    parentId,
    iterationPath,
    areaPath,
    tags,
    isValidState,
    init,
  }

});