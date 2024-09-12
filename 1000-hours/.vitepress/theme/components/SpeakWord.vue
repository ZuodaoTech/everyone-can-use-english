<template>
  <div class="speak-word">
    <div class="word">
      {{ props.word }}
    </div>
    <div v-if="pos" class="pos">
      {{ props.pos }}
    </div>
    <div class="spacer"></div>
    <div class="ctrl">
      <div
        class="ctrl-part"
        :class="item.label"
        v-for="(item, ix) in audios"
        :key="`audio-${ix}`"
      >
        <div v-if="ix !== 0" class="divider"></div>
        <button
          class="play-button"
          :class="item.label"
          @click="playAudio(item.label)"
        >
          <span class="accent-label">{{ item.label }}</span>
          <img :src="svgUrl(item.label)" class="icon" alt="sound" />
        </button>
        <audio
          class="audio"
          :class="item.label"
          :src="item.audio"
          controls="false"
        ></audio>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getAudioPath } from "../data";
const props = defineProps({
  word: {
    type: String,
    required: true,
  },
  audioUs: {
    type: String,
  },
  audioUk: {
    type: String,
  },
  audioOther: {
    type: String,
  },
  pos: {
    type: String,
  },
});

const svgUrl = (accent) => {
  if (accent === "uk") {
    return "/images/speaker-brown.svg";
  } else if (accent === "us") {
    return "/images/speaker-blue.svg";
  }
  return "/images/speaker-black.svg";
};

const audioPathUS = computed(() => {
  if (props.audioUs) {
    return props.audioUs;
  }
  return getAudioPath(props.word, "us");
});

const audioPathUK = computed(() => {
  if (props.audioUk) {
    return props.audioUk;
  }
  return getAudioPath(props.word, "uk");
});

const audioPathOther = computed(() => {
  if (props.audioUk) {
    return props.audioUk;
  }
  return getAudioPath(props.word, "other");
});

const audios = computed(() => {
  const ret: any = [];
  if (audioPathUS.value) {
    ret.push({ label: "us", audio: audioPathUS.value });
  }
  if (audioPathUK.value) {
    ret.push({ label: "uk", audio: audioPathUK.value });
  }
  if (audioPathOther.value) {
    ret.push({ label: "other", audio: audioPathOther.value });
  }
  return ret;
});

function playAudio(accent) {
  const audioEl: any = document.querySelector(`audio.${accent}`);
  audioEl.play();
}
</script>

<style lang="scss" scoped>
@import url(./SpeakWord.scss);
</style>
