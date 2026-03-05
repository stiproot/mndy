import { defineStore } from "pinia";
import { computed } from "vue";
import { StorageService } from "@/services/storage.service";

export interface IUserState {
  id: string;
  name: string;
}

export const useUsrStore = defineStore("usr-store", () => {

  const id = computed(() => StorageService.usrId());
  const name = computed(() => StorageService.usrName())

  return {
    id,
    name,
  };
});
