<template>
  <div class="home-page md:home-page--md">
    <Slogan />

    <Introduction />

    <Features />

    <Price />

    <Comments />
  </div>
</template>

<script lang="ts">
export default {
  name: "IndexPage",
};
</script>

<script lang="ts" setup>
// defineOgImage({ url: "/images/og-image.png" });
</script>

<style lang="scss" scoped></style>
