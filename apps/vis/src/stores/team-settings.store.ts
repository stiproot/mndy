import { QryService } from "@/services/qry.service";
import { defineStore } from "pinia";
import { ref, inject, computed } from "vue";

export interface ITeamSettingsState {
  name: string | null;
  settings: any | null;
  fieldvalues: any | null;
}

export const useTeamSettingsStore = defineStore("team-settings-store", () => {

  const qryService = inject("qryService")! as QryService;

  const name = ref<ITeamSettingsState['name']>(null);
  const settings = ref<ITeamSettingsState['settings']>(null);
  const fieldvalues = ref<ITeamSettingsState['fieldvalues']>(null);

  const iterationPath = computed((): string | null => settings.value ? `Software${settings.value["defaultIteration"]["path"]}` : null);
  const areaPath = computed((): string | null => fieldvalues.value ? fieldvalues.value["defaultValue"] : null);

  async function init(teamName: string) {
    name.value = teamName;
    const [s, f] = await Promise.all([qryService.getTeamSettings(teamName), qryService.getTeamFieldValues(teamName)]);
    settings.value = s;
    fieldvalues.value = f;
  }

  return {
    name,
    settings,
    iterationPath,
    areaPath,
    init,
  }
});
