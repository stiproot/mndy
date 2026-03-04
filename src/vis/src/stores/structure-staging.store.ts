import { ref } from "vue";
import { defineStore } from "pinia";

export interface IStructureStage {
  staged: any;
}

export const useStructureStagingStore = defineStore("structure-staging", () => {

  const staged = ref<IStructureStage['staged']>(null);

  function init(data: any) {
    console.log("useStructureStagingStore", "data", data);
    staged.value = data;
  }

  return {
    staged,
    init
  };

});