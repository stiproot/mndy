<template>
  <q-drawer v-if="!fullscreen" show-if-above mini :mini-width="110" class="floating-drawer">
    <div class="drawer-content q-pa-md">
      <!-- Logo Section -->
      <q-item id="logo-button" class="logo-container menu-item" tag="router-link" to="/projects" @click="activeMenuItem = 'projects'">
        <img :src="mndyNameLogo" alt="mndyLogo" class="mndy-logo"/>
      </q-item>
      
      <!-- Main Menu Section -->
      <q-list class="main-menu q-gutter-y-lg">
        <q-item class="menu-item" tag="router-link" to="/projects" exact
          exact-active-class="q-item-active" @click="activeMenuItem = 'projects'">
          <q-item-section avatar>
            <q-icon :class="{'inactive-icon': activeMenuItem !== 'projects'}" name="fa-solid fa-layer-group" />
          </q-item-section>
          <q-tooltip :offset="[20, 0]" anchor="center left" self="center right" transition-show="jump-right"
            transition-hide="fade">
            Projects
          </q-tooltip>
        </q-item>

        <q-item class="menu-item" clickable tag="router-link" to="/workitems/clone" exact
          exact-active-class="q-item-active" @click="activeMenuItem = 'clone'">
          <q-item-section avatar>
            <q-icon :class="{'inactive-icon': activeMenuItem !== 'clone'}" :name="activeMenuItem !== 'clone' ? 'fa-regular fa-clone' : 'fa-solid fa-clone'" />
          </q-item-section>
          <q-tooltip :offset="[20, 0]" anchor="center left" self="center right" transition-show="jump-right"
            transition-hide="fade">
            Clone Work Item tree
          </q-tooltip>
        </q-item>

        <q-item class="menu-item" clickable tag="router-link" to="/workitems/bulkcreate" exact
          exact-active-class="q-item-active" @click="activeMenuItem = 'bulkcreate'">
          <q-item-section avatar>
            <q-icon :class="{'inactive-icon': activeMenuItem !== 'bulkcreate'}" :name="activeMenuItem !== 'bulkcreate' ? 'fa-regular fa-pen-to-square' : 'fa-solid fa-pen-to-square'"/>
          </q-item-section>
          <q-tooltip :offset="[20, 0]" anchor="center left" self="center right" transition-show="jump-right"
            transition-hide="fade">
            Bulk Create Work Items
          </q-tooltip>
        </q-item>

        <q-item class="menu-item" clickable tag="router-link" to="/workitems/update" exact
          exact-active-class="q-item-active" @click="activeMenuItem = 'update'">
          <q-item-section avatar>
            <q-icon :class="{'inactive-icon': activeMenuItem !== 'update'}" :name="activeMenuItem !== 'update' ? 'fa-regular fa-circle-down' : 'fa-solid fa-circle-down'"/>
          </q-item-section>
          <q-tooltip :offset="[20, 0]" anchor="center left" self="center right" transition-show="jump-right"
            transition-hide="fade">
            Update Work Items
          </q-tooltip>
        </q-item>

        <q-item class="menu-item" clickable tag="router-link" to="/dashboard/create" exact
          exact-active-class="q-item-active" @click="activeMenuItem = 'dashboard'">
          <q-item-section avatar>
            <q-icon size="26px" :class="{'inactive-icon': activeMenuItem !== 'dashboard'}" :name="activeMenuItem !== 'dashboard' ? 'sym_r_dashboard' : 'dashboard'"/>
          </q-item-section>
          <q-tooltip :offset="[20, 0]" anchor="center left" self="center right" transition-show="jump-right"
            transition-hide="fade">
            Create Dashboard
          </q-tooltip>
        </q-item>
      </q-list>

      <!-- Settings Section -->
      <div>
        <!-- Pinned Projects Button with Dropdown Menu -->
        <q-item class="menu-item" clickable>
          <q-item-section avatar>
            <q-icon name="fa-solid fa-thumbtack" />
            <q-menu style="border-radius: 16px; border: 2px solid #EEF1F4" v-model="showPinnedProjects" :offset="[40, 0]" fit
              anchor="center right" self="center left" transition-show="jump-right" transition-hide="jump-left">
              <pinned-projs-view @closeMenu="showPinnedProjects = false" />
            </q-menu>
          </q-item-section>
          <q-tooltip :offset="[20, 0]" anchor="center left" self="center right" transition-show="jump-right"
            transition-hide="fade">
            Pinned Projects
          </q-tooltip>
        </q-item>
        <div class="settings-section">
          <q-separator />
          <q-item class="menu-item" clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="fa-solid fa-gear"/>
              <q-menu v-model="showSettingsMenu" :offset="[0, 0]" transition-show="jump-down" transition-hide="jump-up">
                <q-list style="min-width: 150px">
                  <q-item clickable @click="navService.goToSettings()">
                    <q-item-section>Settings</q-item-section>
                  </q-item>
                  <q-item clickable @click="handleLogoutClick">
                    <q-item-section>Logout</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-item-section>
          </q-item>
          <q-item>
            <q-avatar size="lg" text-color="white" class="user-avatar" color="accent" font-size="14px">
              {{ userInitials }}
              <q-tooltip anchor="center left" self="center right" transition-show="jump-right"
              transition-hide="fade">{{ name }}</q-tooltip>
            </q-avatar>
          </q-item>
        </div>
      </div>
    </div>
  </q-drawer>
</template>

<script>
import { storeToRefs } from 'pinia'
import { ref, inject, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLayoutStore } from "@/stores/layout.store";
import { useUsrStore } from "@/stores/usr.store";
import PinnedProjsView from "@/views/PinnedProjsView";
import mndyLogo from '@/assets/mndy_logo_2.svg';
import mndyNameLogo from '@/assets/mndy_name_logo.svg';

export default {
  name: "SidebarMenuComponent",
  components: {
    PinnedProjsView,
  },
  setup() {
    const store = useLayoutStore();
    const { fullscreen } = storeToRefs(store);

    // Reactive state to track the visibility of the Pinned Projects menu
    const showPinnedProjects = ref(false);
    const showSettingsMenu = ref(false);
    const activeMenuItem = ref('projects'); // Default active menu item
    const userStore = useUsrStore();
    const { name } = storeToRefs(userStore);

    const navService = inject("navService");
    const authService = inject("authService");

    const route = useRoute();

    const userInitials = computed(() => {
      const nameParts = name.value.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts[1];
      return `${firstName[0]}${lastName[0]}`;
    });

    // Watch for route changes and update the activeMenuItem
    watch(route, (newRoute) => {
      const path = newRoute.path;
      if (path.startsWith('/projects')) {
        activeMenuItem.value = 'projects';
      } else if (path.startsWith('/workitems/clone')) {
        activeMenuItem.value = 'clone';
      } else if (path.startsWith('/workitems/bulkcreate')) {
        activeMenuItem.value = 'bulkcreate';
      } else if (path.startsWith('/workitems/update')) {
        activeMenuItem.value = 'update';
      } else if (path.startsWith('/dashboard/create')) {
        activeMenuItem.value = 'dashboard';
      } else if (path.startsWith('/pinned')) {
        activeMenuItem.value = 'pinned';
      } else if (path.startsWith('/settings')) {
        activeMenuItem.value = 'settings';
      }
    }, { immediate: true });

    function handleLogoutClick() {
      authService.logout();
    }

    return {
      fullscreen,
      drawer: ref(true),
      showPinnedProjects,
      showSettingsMenu,
      mndyLogo,
      mndyNameLogo,
      navService,
      handleLogoutClick,
      activeMenuItem,
      userInitials,
      name
    };
  },
};
</script>

<style lang="scss" scoped>
.q-item-active {
  background-color: $tertiary;
}

::v-deep .q-drawer {
  background-color: transparent;
  height: 97%;
  align-items: center;
  top: 50% !important;
  display: flex;
  justify-content: center;
}

::v-deep .floating-drawer {
  border-radius: 24px !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
  overflow: hidden !important;
  position: absolute !important;
  transform: translateY(-50%) !important;
  background-color: white !important; /* Ensure the background color is set */
  width: 74px !important;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

::v-deep #logo-button.q-hoverable:hover > .q-focus-helper {
  background-color: transparent !important;
}

.mndy-logo {
  width: 55px;
}

.settings-section {
  flex-direction: column;
  display: flex;
  height: 140px;
  justify-content: space-between;
  margin-top: 16px;
}

.pinned-projects-menu-container {
  border-radius: 8px;
}

.menu-item {
  border-radius: 12px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0 !important;
  font-weight: 600;
}

// .inactive-icon {
//   color: #a7a8a2 !important;
// }

.menu-item:hover .q-icon {
  color: $primary !important; /* Change to the desired darker color */
}

@media (max-width: 768px) {
  .drawer-content {
    padding: 16px;
  }

  .menu-item {
    width: 100%;
    height: auto;
    padding: 12px;
  }

  .logo-container {
    margin-bottom: 16px;
  }

  .settings-section {
    height: auto;
    padding: 16px 0;
  }
}
</style>