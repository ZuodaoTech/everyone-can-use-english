<script setup>
import DefaultTheme from 'vitepress/theme'
import SpeakWordInlineConverter from '../components/SpeakWordInlineConverter.vue'
import ThemedImageSwitch from '../components/ThemedImageSwitch.vue'

const { Layout } = DefaultTheme

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

<style lang="scss" >
@import url(../components/SpeakWord.scss);
.speak-word-wrapper {
  display: inline-block;
  margin: 0px;
  vertical-align: middle;
}

</style>