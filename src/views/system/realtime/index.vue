<script setup lang="ts">
defineOptions({
  name: "AdminRealtimeManagement",
  inheritAttrs: false,
});
import RealtimeConnectionPanel from "./components/RealtimeConnectionPanel.vue";
</script>

<template>
  <RealtimeConnectionPanel mode="ALL" />
</template>