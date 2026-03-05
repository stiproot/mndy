<template>
  <q-card class="card-width" :style="{ backgroundColor: item.color }">

    <q-item-section avatar v-if="item.headerIcons && item.headerIcons.length">
      <q-avatar>
        <q-icon :key="i.icon" v-for="i in item.headerIcons" color="white" style="font-size: small;" :name="i.icon" />
      </q-avatar>
    </q-item-section>

    <q-card-section v-if="item.title || item.subTitle">
      <div v-if="item.title" class="text-h6 text-content text-white">
        {{ item.title }}
      </div>
      <div v-if="item.subTitle" class="text-subtitle2 text-white">
        {{ item.subTitle }}
      </div>
    </q-card-section>

    <q-card-section class="text-white" v-if="item.description">
      {{ item.description }}
    </q-card-section>

    <q-separator dark />

    <q-card-actions v-if="item.actions && item.actions.length">
      <q-btn flat class="text-white" v-for="a in item.actions" :key="a.evtId" @click="handleActionClick(a.evtId, item)">
        <span v-if="a.btnText">{{ a.btnText }}</span>
        <q-icon v-if="a.btnIcon" :name="a.btnIcon"></q-icon>
        <q-tooltip v-if="a.tooltip">{{ a.tooltip }}</q-tooltip>
      </q-btn>
    </q-card-actions>

  </q-card>
</template>

<script>
export default {
  name: "ItemComponent",
  props: { item: Object },
  setup(props, { emit }) {
    const emitEvt = (evtId, item) => {
      emit("item-click", { evtId: evtId, item: item });
    };

    const handleActionClick = (evtId, e) => {
      emitEvt(evtId, e);
    };

    return { handleActionClick };
  },
};
</script>
<style scoped>
.card-width {
  min-width: 250px;
}

.text-content {
  white-space: normal;
  overflow: hidden;
}
</style>
