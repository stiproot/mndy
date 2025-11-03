import { QryService } from "@/services/qry.service";
import { defineStore } from "pinia";
import { ref, inject } from "vue";

export interface ITeam {
  id: string;
  name: string;
  url: string;
  description: string;
  identityUrl: string;
}

export interface ITeamsState {
  teams: ITeam[];
}

export const useTeamsStore = defineStore("teams-store", () => {

  const qryService = inject("qryService")! as QryService;

  const teams = ref<ITeamsState['teams']>([]);

  function filter(filter: string) {
    return teams.value.filter((team) => team.name.includes(filter));
  }

  async function init() {
    if (teams.value.length > 0) return;

    const data = await qryService.getAllTeams();
    teams.value = data;
  }

  return {
    teams,
    init,
    filter,
  }
});
