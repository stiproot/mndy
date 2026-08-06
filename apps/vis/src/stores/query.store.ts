import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface IQueryState {
  name: string | null;
  ql: string | null;
}

const defaultState = () : IQueryState => ({
  name: null,
  ql: null,
});

export const useQueryStore = defineStore("query-store", () => {

  const name = ref<IQueryState['name']>(null);
  const ql = ref<IQueryState['ql']>(null);
  const state = computed(() => ({ ql: ql.value, name: name.value } as IQueryState));

  const isStateValid = computed(() => name.value && ql.value);

  function init(data: IQueryState | null = null) {
    const { name: initName, ql: initQl } = data || defaultState();
    name.value = initName;
    ql.value = initQl;
  }

  return {
    name,
    ql,
    state,
    isStateValid,
    init
  };
});
