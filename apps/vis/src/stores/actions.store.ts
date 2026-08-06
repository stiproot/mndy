// import { defineStore } from "pinia";
// import { computed, ref, inject } from "vue";
// import { QryService } from "@/services/qry.service";

// export interface IAction {
//   id: string | null;
// }

// export interface IActionStateStore {
//   actions: IAction[];
// }

// const defaultState = (): IActionStateStore => ({
//   actions: [],
// });

// export const useActionsStore = defineStore("actions-store", () => {

//   const qryService = inject("qryService") as QryService;
//   const actions = ref<IActionStateStore['actions']>([]);

//   async function init(data: IActionStateStore | undefined) {
//     if (!data) data = defaultState();

//   }

//   async function initUnits(projId: string, unitType: string) :  {

//     const units = await qryService.getUnitsOfType({ projId: projId, unitType: unitType });

//   }

//   return {
//     actions,
//     init,
//   }

// });