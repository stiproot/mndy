<template>
  <div class="qa-pa-md row items-start q-gutter-md">
    <item-component
      v-for="i in items"
      :key="i"
      :item="i"
      @item-click="onItemClick"
    />
  </div>
</template>

<script>
import ItemComponent from "./ItemComponent.vue";
export default {
  name: "ItemSelectorComponent",
  components: { ItemComponent },
  props: { items: Array, itemValue: String, itemLabel: String },
  setup(props, { emit }) {
    const emitEvent = (e) => {
      emit(e.evtId, e);
    };

    const onItemClick = (e) => {
      emitEvent(e);
    };

    return { onItemClick };
  },
};
</script>
<style></style>
