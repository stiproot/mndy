import { QryService } from "@/services/qry.service";
import { defineStore } from "pinia";
import { ref, inject } from "vue";

export interface IIterationAttribute {
  startDate: string | null;
  finishDate: string | null;
}

export interface IIteration {
  id: string;
  name: string;
  path: string;
  attributes: IIterationAttribute;
  url: string;
}

export interface IIterationState {
  iterations: IIteration[];
  teamName: string | null;
}

export const useIterationsStore = defineStore("iterations-store", () => {

  const qryService = inject("qryService")! as QryService;

  const teamName = ref<IIterationState['teamName']>(null);
  const iterations = ref<IIterationState['iterations']>([]);

  async function init(_teamName: string) {

    if (teamName.value === _teamName) {
      return;
    }

    teamName.value = _teamName;
    const data = await qryService.getTeamIterations(teamName.value);
    iterations.value = data;
  }

  function filter(filter: string) {
    const lowerFilter = filter.toLowerCase();
    return iterations.value.filter((i) =>
      i.name.toLowerCase().includes(lowerFilter)
    );
  }

  return {
    teamName,
    iterations,
    init,
    filter,
  };

});
