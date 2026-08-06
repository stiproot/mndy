<template>
  <circular-loading-component />
  <q-layout view="lHh Lpr lFf">
    <loading-component />
    <router-view></router-view>
    <router-view name="login"></router-view>
    <router-view name="callback"></router-view>
  </q-layout>
</template>

<script>
import { provide } from "vue";
import { useRouter } from "vue-router";
import { CmdService } from "./services/cmd.service";
import { QryService } from "./services/qry.service";
import { AuthService } from "./services/auth.service";
import { NavService } from "./services/nav.service";
import LoadingComponent from "@/components/LoadingComponent.vue";
import CircularLoadingComponent from "@/components/CircularLoadingComponent.vue";

export default {
  name: "LayoutDefault",
  components: {
    LoadingComponent,
    CircularLoadingComponent
  },
  setup() {
    const router = useRouter();

    const cmdService = new CmdService();
    const qryService = new QryService();
    const authService = new AuthService();
    const navService = new NavService(router);

    provide('cmdService', cmdService);
    provide('qryService', qryService);
    provide('authService', authService);
    provide('navService', navService);

    return {};
  },
};
</script>
