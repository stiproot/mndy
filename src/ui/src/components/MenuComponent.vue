<template>
  <div class="q-pa-md">
    <q-header color="blue" elevated class="">
      <div class="row no-wrap shadow-1">
        <q-toolbar class="col-7">
          <q-btn flat round dense icon="menu" @click="maximized = !maximized" />
          <q-toolbar-title class="text-weight-bold">mndy</q-toolbar-title>
          <q-input dark dense flat standout v-model="menuSearch" input-class="text-left"
            class="q-ml-md searchbar-min-width">
            <template v-slot:append>
              <q-icon v-if="menuSearch === ''" name="search" />
              <q-icon v-else name="clear" class="cursor-pointer" @click="menuSearch = ''" />
            </template>
          </q-input>
        </q-toolbar>

        <q-toolbar class="col-5 bg-primary text-white">
          <q-space />
          <q-tabs v-model="menuTab" shrink>
            <q-tab name="mine" label="mine" />
            <q-tab name="all" label="all" />
          </q-tabs>
          <q-chip color="blue">
            <q-avatar text-color="white" icon="account_circle"></q-avatar>
            <span class="text-white">{{ name }}</span>
          </q-chip>

          <q-btn flat round dense icon="more_vert" color="white">
            <q-menu :offset="[0, 5]" transition-show="jump-down" transition-hide="jump-up">
              <q-list style="min-width: 150px">
                <q-item clickable @click="navService.goToSettings()">
                  <q-item-section>Settings</q-item-section>
                </q-item>
                <q-item clickable @click="handleLogoutClick">
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

        </q-toolbar>
      </div>
    </q-header>
  </div>
</template>
<script>
import { onMounted, inject } from "vue";
import { storeToRefs } from 'pinia'
import { useLayoutStore } from "@/stores/layout.store";
import { useUsrStore } from "@/stores/usr.store";

export default {
  name: "MenuComponent",
  setup() {

    const navService = inject("navService");
    const authService = inject("authService");

    const layoutStore = useLayoutStore();
    const { maximized, menuTab, menuSearch } = storeToRefs(layoutStore);
    const userStore = useUsrStore();
    const { name } = storeToRefs(userStore);

    function handleLogoutClick() {
      authService.logout();
    }

    function initState() { }

    onMounted(() => {
      initState();
    });

    return {
      maximized,
      name,
      navService,
      menuTab,
      menuSearch,
      handleLogoutClick
    };
  },
};
</script>
<style scoped>

.searchbar-min-width {
  min-width: 450px;
}

</style>