<template>
  <q-splitter v-model="splitterModel">
    <template v-slot:before>
      <q-tabs v-model="tab" vertical class="text-teal">
        <q-tab name="clone" icon="content_copy" label="" />
        <q-tab name="bulk" icon="add" label="" />
        <q-tab name="update" icon="build" label="" />
      </q-tabs>
    </template>

    <template v-slot:after>
      <q-tab-panels
        v-model="tab"
        animated
        swipeable
        vertical
        transition-prev="jump-up"
        transition-next="jump-up"
      >
        <q-tab-panel name="clone">
          <div class="text-h4 q-mb-md">Clone</div>
          <CloneAzdoWiView />
        </q-tab-panel>

        <q-tab-panel name="update">
          <div class="text-h4 q-mb-md">Update</div>
          <UpdateAzdoWiView />
        </q-tab-panel>

        <q-tab-panel name="bulk">
          <div class="text-h4 q-mb-md">Bulk Create</div>
          <BulkCreateAzdoWisView />
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-splitter>
</template>
<script>
import { watch, ref } from "vue";
import { useRouter } from "vue-router";
import CloneAzdoWiView from "./azdo/CloneAzdoWiView.vue";
import BulkCreateAzdoWisView from "./azdo/BulkCreateAzdoWisView.vue";
import UpdateAzdoWiView from "./azdo/UpdateAzdoWiView.vue";
export default {
  name: "AzdoWiManagerView",
  components: {
    CloneAzdoWiView,
    BulkCreateAzdoWisView,
    UpdateAzdoWiView
  },
  props: {
    tabId: {
      type: String,
      default: () => "clone",
    },
  },
  setup(props) {
    const router = useRouter();

    const tab = ref(props.tabId);
    watch(
      () => tab.value,
      (val) => {
        router.replace({ query: { tab: val } });
      }
    );

    return {
      tab,
    };
  },
};
</script>
<style>
.float-right {
  float: right;
}
</style>
