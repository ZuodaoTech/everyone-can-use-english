<script setup>
import DefaultTheme from 'vitepress/theme'
import SpeakWordInlineConverter from '../components/SpeakWordInlineConverter.vue'

const { Layout } = DefaultTheme

</script>

<template>
  <Layout>
    <template #doc-after>
      <ClientOnly>
        <SpeakWordInlineConverter />
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
.speak-word.inline {
  border: none;
  display: flex;
  padding: 0;
  .word {
    display: inline-block;
  }
  .ctrl-part {
    .play-button {
      display: flex;
      width: 24px;
      height: 24px;
      align-items: center;
      justify-content: center;
      .icon {
        width: 16px;
        height: 16px;
      }
    }
    .accent-label {
      font-size: 14px;
      display: inline-block;
      color: white;
    }
  }
}
</style>