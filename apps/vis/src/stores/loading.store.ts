import { StorageService } from "@/services/storage.service";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface ILoadingState {
  loading: boolean;
  circLoading: boolean;
}

export const useLoadingStore = defineStore("loading", () => {

  const loading = ref<ILoadingState['loading']>(false);
  const circLoading = ref<ILoadingState['circLoading']>(false);
  const isTokenRefreshing = computed(() => StorageService.isTokenRefreshing());

  return {
    loading,
    circLoading,
    isTokenRefreshing,
  };
});