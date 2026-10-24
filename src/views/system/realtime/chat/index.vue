<template>
  <RealtimeConnectionPanel mode="CHAT" :allow-ban="true" />
</template>

<script setup lang="ts">
defineOptions({
  name: "ChatRealtimeManagement",
  inheritAttrs: false,
});

import RealtimeConnectionPanel from "../components/RealtimeConnectionPanel.vue";
</script>