import { IItem } from "@/types/i-item";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

const DEFAULT_QUERY_FOLDER_BASE_PATH = "Shared Queries/DepartmentZ/Business Unit P/A Team/Project X/Dashboard Queries";

export interface IInitiative {
  title: string | null;
  tag: string | null;
  desc: string | null;
}

export interface ICreateDashboardCmd {
  dashboardName: string | null;
  iterationPath: string | null;
  teamName: string | null;
  queryFolderBasePath: string | null;
  initiatives: IInitiative[];
}

const defaultState = (): ICreateDashboardCmd => ({
  dashboardName: null,
  iterationPath: null,
  teamName: null,
  queryFolderBasePath: DEFAULT_QUERY_FOLDER_BASE_PATH,
  initiatives: [],
});

export const useCreateAzdoDashboardStore = defineStore("azdo-dashboard", () => {

  const DEFAULT_COLOR = "#3279a8";

  const dashboardName = ref<ICreateDashboardCmd['dashboardName']>(null);
  const iterationPath = ref<ICreateDashboardCmd['iterationPath']>(null);
  const teamName = ref<ICreateDashboardCmd['teamName']>(null);
  const queryFolderBasePath = ref<ICreateDashboardCmd['queryFolderBasePath']>(DEFAULT_QUERY_FOLDER_BASE_PATH);
  const initiatives = ref<ICreateDashboardCmd['initiatives']>([]);
  const enrichedInitiatives = computed(() => initiatives.value.map(i => enrich(i)))

  const isValidState = computed(() =>
    dashboardName.value &&
    iterationPath.value &&
    teamName.value &&
    queryFolderBasePath.value &&
    initiatives.value &&
    initiatives.value.length > 0
  );

  function addInitiative(data: IInitiative) {
    initiatives.value.push(data);
  }

  function removeInitiative(data: IInitiative) {
    initiatives.value = initiatives.value.filter((x) => x.tag !== data.tag);
  }

  function init(data: ICreateDashboardCmd | undefined) {

    if (!data) data = defaultState();

    dashboardName.value = data.dashboardName;
    iterationPath.value = data.iterationPath;
    teamName.value = data.teamName;
    queryFolderBasePath.value = data.queryFolderBasePath;
    initiatives.value = data.initiatives;
  }

  function enrich(data: IInitiative): IItem<IInitiative> {
    const item = {
      title: data.title,
      description: `tag: ${data.tag}`,
      color: DEFAULT_COLOR,
      actions: [
        { evtId: "remove-click", btnIcon: "delete", tooltip: "Remove", btnText: null },
      ],
      headerIcons: [],
      data: data,
    } as IItem<IInitiative>;

    return item;
  }

  return {
    dashboardName,
    iterationPath,
    teamName,
    queryFolderBasePath,
    initiatives,
    isValidState,
    enrichedInitiatives,
    addInitiative,
    removeInitiative,
    init,
  };
});