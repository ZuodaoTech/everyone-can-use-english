<template>
  <div class="page-header h-11 font-medium text-greyscale_3">
    <div class="flex justify-between px-6 py-3">
      <Logo />

      <div class="flex gap-4">
        <a class="action" href="https://github.com/ZuodaoTech/">Github</a>
        <span class="divider"></span>
        <a class="action" href="https://1000h.org/enjoy-app">Enjoy App</a>
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
