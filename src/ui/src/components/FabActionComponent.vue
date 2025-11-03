<template>
  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-fab-actions>
      <slot />
    </q-fab-actions>
  </q-page-sticky>
</template>
<script>
export default {
  name: "FabActionComponent",
  setup() {
    return {};
  },
};
</script>
<style></style>
