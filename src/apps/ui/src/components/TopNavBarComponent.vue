<template>
  <q-header class="text-primary q-pl-sm q-pr-lg q-pt-lg header-container">
    <q-toolbar-title class="text-weight-bold col-4">{{ processedTitle }}
      <q-icon size="xs" class="q-mb-xs q-ml-xs" name="info">
        <q-tooltip>{{ pageDescription }}</q-tooltip>
      </q-icon>
    </q-toolbar-title>

    <q-space />

    <q-input dense borderless v-model="menuSearch" type="search" input-class="text-right" placeholder="Search" class="search-input">
      <template v-slot:append>
        <q-icon v-if="menuSearch === ''" name="search" />
        <q-icon v-else name="clear" class="cursor-pointer" @click="menuSearch = ''" />
      </template>
    </q-input>

    <!-- <img :src="mndyNameLogo" alt="My Icon" class="mndy-icon" /> -->
  </q-header>
</template>

<script>
import { defineComponent, onMounted, inject, watch, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useLayoutStore } from "@/stores/layout.store";
import { useUsrStore } from "@/stores/usr.store";
import mndyNameLogo from '@/assets/mndy_name_logo.svg';

export default defineComponent({
  name: "NavigationTopBar",
  setup() {
    const navService = inject("navService");
    const authService = inject("authService");

    const layoutStore = useLayoutStore();
    const { maximized, menuSearch } = storeToRefs(layoutStore);
    const userStore = useUsrStore();
    const { name } = storeToRefs(userStore);

    const route = useRoute();
    const pageTitle = ref(route.meta.title || route.name || 'mndy');
    const pageDescription = ref(route.meta.description || '');

    const processedTitle = computed(() => {
      return pageTitle.value.replace(/\|?\s*mndy\s*$/, '').trim();
    });

    const userInitials = computed(() => {
      const nameParts = name.value.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts[1];
      return `${firstName[0]}${lastName[0]}`;
    });

    function handleLogoutClick() {
      authService.logout();
    }

    function initState() { }

    onMounted(() => {
      initState();
    });

    // Watch for route changes and update the pageTitle and pageDescription
    watch(route, (newRoute) => {
      pageTitle.value = newRoute.meta.title || newRoute.name || 'mndy';
      pageDescription.value = newRoute.meta.description || '';
    });

    return {
      maximized,
      name,
      navService,
      menuSearch,
      handleLogoutClick,
      pageTitle,
      processedTitle,
      pageDescription,
      userInitials,
      mndyNameLogo
    };
  },
});
</script>

<style scoped>
.header-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 77px;
  text-align: center;
  background: #f5f6fa;
}

.q-toolbar-title {
  font-size: 20px;
}

.search-input {
  width: 600px;
}

.user-avatar {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0 !important;
}

.mndy-icon {
  width: 70px; /* Adjust the size as needed */
  height: auto;
  margin-left: 12px;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    height: auto;
    padding: 16px;
  }

  .q-toolbar-title {
    font-size: 18px;
  }

  .search-input {
    width: 100%;
    margin-top: 8px;
  }

  .user-container {
    margin-top: 8px;
  }
}
</style>
