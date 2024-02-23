<template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const currentTheme = ref('light');

const props = defineProps({
  base: {
    type: String,
    required: true,
  },
  res: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: "",
  },
});

const imgUrl = computed(() => {
  if (isDarkTheme()) {
    return `${props.base}/${props.res}.dark.svg`;
  }
  return `${props.base}/${props.res}.light.svg`;
});

function isDarkTheme() {
  // check html element class, if it is dark, return true
  let ret = document.documentElement.classList.contains('dark');
  if (currentTheme.value === 'dark') {
    ret = true
  }
  return ret;
}

function switchImagesTheme(isDark:boolean) {
  const themedImages = document.querySelectorAll('img.themed');
  for (let i = 0; i < themedImages.length; i ++) {
    const img:any = themedImages[i];
    const originalSrc:any = img.getAttribute('src')
    const parts = originalSrc.split('.');
    const prefix = parts.shift();
    const ext = parts.pop();
    const mid = isDark ? 'dark' : 'light';
    if (prefix && ext && (prefix !== ext)) {
      const newSrc = `${prefix}.${mid}.${ext}`
      img.onerror = () => {
        img.setAttribute('src', originalSrc);
      }
      img.setAttribute('src', newSrc);
    }
  }
}

onMounted(() => {
  const htmlEle:any = document.querySelector('html');

  const observer = new MutationObserver((mutationsList, observer) => {
    for(const mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        switchImagesTheme(htmlEle.classList.contains('dark'))
      }
    }
  });

  const config = {
    attributes: true,
    attributeFilter: ['class']
  };
  observer.observe(htmlEle, config);

  // apply html
  switchImagesTheme(htmlEle.classList.contains('dark'));
});
</script>


<style lang="scss" scoped>
.image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    width: 100%;
    height: auto;
  }
}
</style>
