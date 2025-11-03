import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { yml2Json, json2Yml } from "@/services/yml.service";
import { getCyberdyneMdlcYml, getGenysisMdlcYml, getChapmansPeakSdlcYml } from "@/services/template.service";

export interface IUploadWorkItem {
  title: string;
  type: string;
  area_path: string;
  iteration_path: string;
  acceptance_criteria: string;
  state: string;
  tags: string;
  assigned_to: string;
  children: IUploadWorkItem[];
}

export interface IBulkUploadWorkItemState {
  yml: string | null;
  obj: any | null;
}

export const useBulkCreateAzdoWisStore = defineStore('bulk-create-azdo-wis-store', () => {

  const yml = ref<IBulkUploadWorkItemState['yml']>(null);
  const obj = ref<IBulkUploadWorkItemState['obj']>(null);

  const isValidState = computed(() => obj.value);

  function refreshFromYml(enrichers: CallableFunction[] = []) {
    if (!yml.value) return;
    obj.value = yml2Json(yml.value, enrichers);
    yml.value = json2Yml(obj.value);
  }

  function refreshFromJson(enrichers: CallableFunction[] = []) {
    if (!obj.value) return;
    yml.value = json2Yml(obj.value, enrichers)
    obj.value = yml2Json(yml.value);
  }

  function loadCyberdyneMdlcYml(): string {
    return getCyberdyneMdlcYml();
  }

  function loadGenysisMdlcYml(): string {
    return getGenysisMdlcYml();
  }

  function loadChapmansPeakSdlcYml(): string {
    return getChapmansPeakSdlcYml();
  }

  return {
    yml,
    obj,
    isValidState,
    refreshFromYml,
    refreshFromJson,
    loadCyberdyneMdlcYml,
    loadGenysisMdlcYml,
    loadChapmansPeakSdlcYml
  }
});