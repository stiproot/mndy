// stores/project-details.store.ts
import { defineStore } from "pinia";
import { inject, watch } from "vue";
import { computed, ref, Ref, ComputedRef } from "vue";
import { QryService } from "@/services/qry.service";
import { CmdService } from "@/services/cmd.service";
import { now } from "@/services/timestamp.service";
import { StorageService } from "@/services/storage.service";
import { IItem } from "@/types/i-item";
import { randomColorFromPallete } from "@/services/color.service";
import { buildWiqlFromTag } from "@/services/wiql.service";
import { IProj, IWiql } from "@/types/i-proj";

export const defaultState = (): IProj => ({
  id: null,
  name: null,
  tag: null,
  color: randomColorFromPallete(),
  description: null,
  ql: null,
  is_pinned: "false",
  summary: null,
  user_id: StorageService.usrId(),
  utc_created_timestamp: now(),
  utc_updated_timestamp: now(),
});

export const useProjectDetailsStore = defineStore('project-details', () => {

  const qryService = inject<QryService>("qryService");
  const cmdService = inject<CmdService>("cmdService");
  const DEFAULT_COLOR = "#3279a8";

  const id: Ref<IProj['id']> = ref(null);
  const name: Ref<IProj['name']> = ref(null);
  const tag: Ref<IProj['tag']> = ref(null);
  const description: Ref<IProj['description']> = ref(null);
  const ql: Ref<IProj['ql']> = ref(null);
  const color: Ref<IProj['color']> = ref(randomColorFromPallete());
  const userId: Ref<IProj['user_id']> = ref(StorageService.usrId());
  const isPinned: Ref<IProj['is_pinned']> = ref("false");
  const summary: Ref<IProj['summary']> = ref(null);
  const created: Ref<IProj['utc_created_timestamp']> = ref(now());
  const updated: Ref<IProj['utc_updated_timestamp']> = ref(now());

  const state: ComputedRef<IProj> = computed(() => ({
    id: id.value,
    name: name.value,
    tag: tag.value,
    description: description.value,
    ql: ql.value,
    color: color.value,
    user_id: userId.value,
    is_pinned: isPinned.value,
    summary: summary.value,
    utc_created_timestamp: created.value,
    utc_updated_timestamp: updated.value,
  }));

  const isStateValid = computed(() =>
    id.value &&
    name.value &&
    tag.value &&
    color.value &&
    ql.value
  );

  const runnableQueries = computed(() => [{ name: tag.value, ql: ql.value } as IWiql].map(q => ({
    title: q.name,
    color: DEFAULT_COLOR,
    actions: [
      {
        evtId: "run-click",
        btnIcon: "refresh",
      },
    ],
    data: q
  } as IItem<IWiql>)));

  watch(() => tag.value, (newVal) => {
    if (!newVal) {
      ql.value = null;
      return;
    }
    const q = buildWiqlFromTag(newVal);
    ql.value = q;
  });

  watch(
    () => name.value,
    (newVal) => {
      if (newVal) {
        id.value = newVal.toLowerCase().split(" ").join("_");
        return;
      }
      id.value = null;
    }
  );

  async function init(projectId: string) {
    if (!projectId || projectId === "new") {
      setState(null);
      return;
    }
    const project = await qryService!.getProjQry(projectId);
    setState(project);
  }

  async function sync() {
    await cmdService!.publishPersistProjCmd(state.value);
  }

  function setState(data: IProj | null) {
    const {
      id: newId,
      name: newName,
      tag: newTag,
      description: newDescription,
      ql: newQl,
      color: newColor,
      is_pinned: newIsPinned,
      summary: newSummary,
      utc_created_timestamp: newCreated,
      utc_updated_timestamp: newUpdated,
    } = data || defaultState();

    id.value = newId;
    name.value = newName;
    tag.value = newTag;
    description.value = newDescription;
    ql.value = newQl;
    color.value = newColor;
    isPinned.value = newIsPinned;
    summary.value = newSummary;
    created.value = newCreated;
    updated.value = newUpdated;
  }

  return {
    id,
    name,
    tag,
    description,
    ql,
    color,
    userId,
    isPinned,
    created,
    updated,
    summary,
    state,
    isStateValid,
    runnableQueries,
    setState,
    sync,
    init,
  }
});
