<template>
  <q-btn fab :icon="icon || 'close'" @click="handleClick" />
</template>
<script>
export default {
  name: "BtnComponent",
  props: { icon: String, color: String },
  setup(props, { emit }) {
    const emitEvent = () => {
      emit("click");
    };

    const handleClick = () => {
      emitEvent();
    };

    return {
      handleClick,
    };
  },
};
</script>
<style></style>
