<template>
  <q-list separator style="min-width: 300px">
    <template v-if="pinnedProjects.length > 0">
      <q-item clickable :key="i.name" v-for="i in pinnedProjects">
        <q-item-section class="col-10 gt-sm" @click="handleViewClick(i)">
          <q-item-label lines="1" class="text-primary cursor-pointer">{{ i.name }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat dense round size="sm" padding="sm" @click.stop="handleUnpinClick(i)" icon="push_pin"/>
        </q-item-section>
      </q-item>
    </template>
    <template v-else>
      <q-item>
        <q-item-section class="text-center">
          <q-item-label>No pinned projects</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script>
import { onMounted, inject } from "vue";
import { storeToRefs } from 'pinia'
import { useLoadingStore } from "@/stores/loading.store";
import { useProjectsStore } from "@/stores/projects.store";

export default {
  name: "PinnedProjsView",
  emits: ['closeMenu'],
  setup(props, { emit }) {
    const navService = inject("navService");
    const loadingStore = useLoadingStore();
    const projectsStore = useProjectsStore();

    const { loading } = storeToRefs(loadingStore);
    const { pinnedProjects } = storeToRefs(projectsStore);
    const { refreshPinned, unpinProject } = projectsStore;

    const handleViewClick = (e) => {
      if (!e) return;
      loading.value = true;
      navService.goToProjHome(e.id);
      emit('closeMenu');
    };

    const handleUnpinClick = async (e) => {
      await unpinProject(e.id);
    };

    onMounted(async () => {
      await refreshPinned();
    });

    return {
      pinnedProjects,
      handleViewClick,
      handleUnpinClick,
    };
  },
};
</script>

<style scoped>
.q-list {
  padding: 0; /* Remove padding */
}
.text-center {
  text-align: center;
}
</style>