<!-- src/views/LandingView.vue -->
<template>
  <navigation-top-bar v-if="!fullscreen" />

  <sidebar-menu-component v-if="!fullscreen" />

  <q-page-container>
    <router-view></router-view>
  </q-page-container>

  <img :src="CompanyXLogo" alt="CompanyX logo" class="bottom-right-icon" />

</template>

<script>
import { storeToRefs } from 'pinia'
import { useLayoutStore } from "@/stores/layout.store";
import NavigationTopBar from "@/components/TopNavBarComponent.vue";
import SidebarMenuComponent from "@/components/SidebarMenuComponent.vue";
import CompanyXLogo from "@/assets/CompanyX_logo.svg";

export default {
  name: "LandingView",
  components: {
    NavigationTopBar,
    SidebarMenuComponent,
  },
  setup() {
    const store = useLayoutStore();
    const { maximized, fullscreen } = storeToRefs(store);

    return {
      maximized,
      fullscreen,
      CompanyXLogo
    };
  },
};
</script>

<style scoped>
.bottom-right-icon {
  position: fixed;
  bottom: 10px;
  right: 14px;
  width: 24px;
}
</style>