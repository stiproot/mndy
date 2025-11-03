import { computed, inject, ref } from "vue";
import { defineStore } from "pinia";
import { QryService } from "@/services/qry.service";
import { CmdService } from "@/services/cmd.service";
import { StorageService } from "@/services/storage.service";
import { IItem, IItemAction } from "@/types/i-item";
import { IUpdateProjCmd } from "@/types/i-update-proj-cmd";
import { toLocale } from "@/services/timestamp.service";
import { getProjectRAGColor } from "@/services/color.service";
import { IProj } from "@/types/i-proj";

export interface IProjectsState {
  projects: IProj[];
  usrProjects: IProj[];
  pinnedProjects: IProj[];
}

export const useProjectsStore = defineStore("projects-store", () => {

  const qryService: QryService | undefined = inject("qryService");
  const cmdService: CmdService | undefined = inject("cmdService");

  const projects = ref<IProjectsState['projects']>([]);
  const usrProjects = ref<IProjectsState['usrProjects']>([]);
  const pinnedProjects = ref<IProjectsState['pinnedProjects']>([]);

  function enrichProjects(data: IProj[], isPinnable: boolean = false): any[] {
    return data.map((d) => {

      if (d.summary) {
        if (d.summary.utc_target_timestamp) d.summary.utc_target_timestamp = toLocale(d.summary.utc_target_timestamp);
      }

      const riskImpactStatus = d.summary?.risk_impact_status || "#ffffff";


      const item = {
        title: d.name,
        description: null,
        color: d.summary?.risk_impact_status ? getProjectRAGColor(d.summary?.risk_impact_status) : d.color,
        actions: [
          { evtId: "view-click", btnIcon: "visibility", tooltip: "Project details", btnText: null },
          { evtId: "visuals-click", btnIcon: "analytics", tooltip: "Project insights", btnText: null },
          { evtId: "actions-click", btnIcon: "build", tooltip: "Project actions", btnText: null },
        ],
        headerIcons: [],
        data: d,
      } as IItem<IProj>;

      if (d.is_pinned === "false" && isPinnable) {
        item.actions?.push({ evtId: "pin-click", btnIcon: "push_pin", tooltip: "Pin project" } as IItemAction);
      }

      if (d.is_pinned === "true" && isPinnable) {
        item.headerIcons?.push({ icon: "push_pin" });
      }

      return item;
    });
  }

  const enrichedProjects = computed(() => enrichProjects(projects.value));
  const enrichedUsrProjects = computed(() => enrichProjects(usrProjects.value, true));

  async function refreshPinned() {
    const pinned = await qryService!.getProjsQry({ isPinned: "true", userId: StorageService.usrId() });
    pinnedProjects.value = pinned;
  }

  function markExistingAsPinned(projId: string, pinned: string = "true") {
    usrProjects.value
      .filter(p => p.id === projId)
      .forEach(p => p.is_pinned = pinned);
  }

  async function pinProject(projId: string) {
    const cmd = {
      projectId: projId,
      delta: { "is_pinned": "true" }
    } as IUpdateProjCmd;

    await cmdService!.publishUpdateProjCmd(cmd);
    markExistingAsPinned(projId);
    await refreshPinned();
  }

  async function unpinProject(projId: string) {
    const cmd = {
      projectId: projId,
      delta: { "is_pinned": "false" }
    } as IUpdateProjCmd;

    await cmdService!.publishUpdateProjCmd(cmd);
    markExistingAsPinned(projId, "false");
    await refreshPinned();
  }

  async function init() {
    const [usrs, all, pinned] = await Promise.all([
      qryService!.getProjsQry({ userId: StorageService.usrId() }),
      qryService!.getProjsQry({}),
      qryService!.getProjsQry({ isPinned: "true", userId: StorageService.usrId() }),
    ]);

    usrProjects.value = usrs;
    projects.value = all;
    pinnedProjects.value = pinned;
  }

  return {
    enrichedProjects,
    enrichedUsrProjects,
    pinnedProjects,
    refreshPinned,
    pinProject,
    unpinProject,
    markExistingAsPinned,
    init,
  };

});