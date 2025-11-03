import { computed, inject, ref } from "vue";
import { defineStore } from "pinia";
import { ProcStatuses } from "@/types/proc-statuses";
import { QryService } from "@/services/qry.service";
import { IProc } from "@/types/i-proc";

export interface IProcStoreState {
  cmds: any | null;
  key: string | null;
  procs: IProc[];
}

export const useProcessStore = defineStore("procs-store", () => {

  const qryService: QryService | undefined = inject("qryService");

  const cmds = ref<IProcStoreState['cmds']>(null);
  const key = ref<IProcStoreState['key']>(null);
  const procs = computed(() => {
    if (!cmds.value) return [];

    if (key.value && cmds.value[key.value]) {
      return cmds.value[key.value]["steps"]
        .map((c: any) => ({
          cmd_type: c["cmd"]["cmd_type"],
          proc_status: c["proc"]["proc_status"]
        } as IProc))
    }

    return Object.values(cmds.value || {})
      .map((c: any) => c["steps"])
      .flat()
      .map((c) => ({
        cmd_type: c["cmd"]["cmd_type"],
        proc_status: c["proc"]["proc_status"]
      } as IProc))
  });

  const isStillRunning = computed(() =>
    procs.value.some((p: IProc) => p.proc_status === ProcStatuses.RUNNING)
  );

  const running = computed(() =>
    procs.value.filter((p: IProc) => p.proc_status === ProcStatuses.RUNNING)
  );

  async function refresh(k: string | null = null) {
    key.value = k;
    const data = await qryService!.getProcsQry({});
    cmds.value = data;
  }

  return {
    procs,
    isStillRunning,
    running,
    refresh,
  };

});
