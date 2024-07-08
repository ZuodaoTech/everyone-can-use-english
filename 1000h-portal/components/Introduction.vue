<template>
  <div class="introduction mt-[64px] md:mt-[96px] lg:mt-[128px]">
    <div class="container m-auto">
      <div class="top flex justify-between">
        <div class="text-greyscale_1">
          <div class="title text-[20px] md:text-[32px]">最朴实的学习方法</div>
          <div class="subtitle text-[14px] md:text-[16px]">
            在 AI 的帮助下，我们提倡直接上手学习，不用理会繁琐的方法论
          </div>
        </div>

        <div class="hint text-[13px] md:text-[14px] text-greyscale_4">
          About <br />
          Product
        </div>
      </div>

      <div class="cards grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-8">
        <div
          v-for="(card, index) in cards"
          :key="index"
          class="card"
          :style="{ backgroundImage: `url(${card.bg})` }"
          @click="handleClick"
        >
          <div class="lable" :style="{ color: card.colors[0] }">
            {{ card.label }}
          </div>
          <div class="title my-4" :style="{ color: card.colors[0] }">
            {{ card.title }}
          </div>
          <div class="subtitle" :style="{ color: card.colors[1] }">
            {{ card.subtitle }}
          </div>

          <div class="arrow">
            <img src="/portal-static/icon/arrow-upright.svg" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "Introduction",
};
</script>

<script lang="ts" setup>
const cards = ref([
  {
    label: "Pronunciation Correction",
    title: "AI 纠正发音",
    subtitle: "Enjoy App 的高级 AI 引擎帮您塑造完美英・美音",
    bg: "/portal-static/images/bg-intro-1.png",
    colors: ["#384C6B", "#7B93AF"],
  },
  {
    label: "Studying Tracking",
    title: "跟踪学习记录",
    subtitle: "提供完整全面的学习记录追踪，进步一目了然",
    bg: "/portal-static/images/bg-intro-2.png",
    colors: ["#4A6760", "#7C978F"],
  },
  {
    label: "Variant Media",
    title: "丰富的在线素材",
    subtitle: "导入互联网语音和视频素材，用你最喜欢的内容学语言",
    bg: "/portal-static/images/bg-intro-3.png",
    colors: ["#384C6B", "#7B93AF"],
  },
  {
    label: "Memory Enhancement",
    title: "拓展记忆力",
    subtitle: "使用 Enjoy App 提供的记忆系统，让学习过的内容在你脑内回荡",
    bg: "/portal-static/images/bg-intro-4.png",
    colors: ["#70584A", "#A4978D"],
  },
]);

function handleClick() {
  window.location.href = "https://1000h.org/intro.html";
}
</script>

<style lang="scss" scoped>
.introduction {
  .top {
    .title {
      font-weight: 600;
    }

    .subtitle {
      margin-top: 4px;
      font-weight: 400;
    }

    .hint {
      font-family: "New York";
      font-style: italic;
      font-weight: 400;
      text-align: right;
    }
  }

  .cards {
    display: grid;
    gap: 16px;

    .card {
      cursor: pointer;
      position: relative;
      color: #fff;
      height: 350px;
      padding: 24px;
      border-radius: 4px;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        border-radius: 4px;
        background: #e5eff8;
        transition: ease-in-out 0.2s;
      }

      &:hover {
        &::before {
          opacity: 0.3;
        }

        .arrow {
          opacity: 1;
        }
      }

      .lable {
        font-family: "New York";
        font-size: 12px;
        font-style: italic;
      }

      .title {
        font-size: 20px;
        font-weight: 500;
        line-height: 1.5;
      }

      .subtitle {
        font-size: 14px;
        font-weight: 400;
        line-height: 1.5;
      }

      .arrow {
        position: absolute;
        opacity: 0;
        bottom: 24px;
        left: 24px;
        transition: ease-in-out 0.2s;
      }
    }
  }
}
</style>
