import { defineStore } from "pinia";
import { ref } from "vue";

export interface ILayoutState {
  maximized: boolean;
  menuTab: string;
  menuSearch: string;
  fullscreen: boolean;
}

const defaultState = () : ILayoutState => ({
  maximized: false,
  menuTab: "all",
  menuSearch: "",
  fullscreen: false,
});

export const useLayoutStore = defineStore("layout", () => {
  const maximized = ref<ILayoutState['maximized']>(false);
  const menuTab =  ref<ILayoutState['menuTab']>("all");
  const menuSearch = ref<ILayoutState['menuSearch']>("");
  const fullscreen = ref<ILayoutState['fullscreen']>(false);

  return {
    maximized,
    menuTab,
    menuSearch,
    fullscreen
  };
});