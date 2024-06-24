<template>
  <div class="page-header h-11 font-medium text-greyscale_3">
    <div class="flex justify-between px-6 py-3">
      <Logo />

      <div class="flex gap-4">
        <span class="action">Github</span>
        <span class="divider"></span>
        <span class="action">享受 APP</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "PageHeader",
};
</script>

<script lang="ts" setup>
import Logo from "../Logo.vue";
</script>

<style lang="scss" scoped>
.divider {
  border-right: 1px solid #d7d7d7;
  margin: 4px 0;
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #fff;
  z-index: 111;

  .action {
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
