<template>
  <div class="default-layout">
    <PageHeader />
    <slot />
    <PageFooter />
  </div>
</template>

<script lang="ts">
export default {
  name: "DefaultLayout",
};
</script>

<script lang="ts" setup>
import PageFooter from "@/components/layout/PageFooter.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
</script>

<style lang="scss" scoped></style>
