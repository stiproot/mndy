import { computed, inject, ref } from "vue";
import { defineStore } from "pinia";
import { QryService } from "@/services/qry.service";
import { IUnit } from "@/types/i-unit";

export interface IUnitsState {
  tasks: IUnit[];
}

const TASK = "Task";

const notNullAndNotUndefined = (val: any) => val !== null && val !== undefined && val.length;

export const useUnitsStore = defineStore("units-store", () => {

  const qryService: QryService | undefined = inject("qryService");

  const tasks = ref<IUnitsState['tasks']>([]);

  const isInitialized = computed(() =>
    notNullAndNotUndefined(tasks.value)
  );

  async function init(projId: string) {
    const resp = await qryService!.getUnitsQry({ projId: projId, unitType: TASK });
    tasks.value = resp["units"];
    console.log("tasks.value", tasks.value);
  }

  return {
    isInitialized,
    tasks,
    init,
  };

});