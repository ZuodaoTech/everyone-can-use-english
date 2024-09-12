<script setup>
import DefaultTheme from "vitepress/theme";
import SpeakWordInlineConverter from "../components/SpeakWordInlineConverter.vue";
import ThemedImageSwitch from "../components/ThemedImageSwitch.vue";
import { register } from "swiper/element/bundle";

const { Layout } = DefaultTheme;

register();
</script>

<template>
  <Layout>
    <template #doc-after>
      <ClientOnly>
        <SpeakWordInlineConverter />
        <ThemedImageSwitch />
      </ClientOnly>
    </template>
  </Layout>
</template>

<style lang="scss">
@import url(../components/SpeakWord.scss);
.speak-word-wrapper {
  display: inline-block;
  margin: 0px;
  vertical-align: middle;
}
</style>
