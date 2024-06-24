<template>
  <div class="features mt-[64px] md:mt-[96px] lg:mt-[128px]">
    <div class="container m-auto">
      <div class="top flex justify-between">
        <div class="text-greyscale_1">
          <div class="title text-[20px] md:text-[32px]">特色功能</div>
          <div class="subtitle text-[14px] md:text-[16px]">
            这是一句简介这是一句简介这是一句简介
          </div>
        </div>

        <div class="hint text-greyscale_4">
          Product <br />
          Features
        </div>
      </div>

      <div class="cards grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div v-for="(feature, index) in features" :key="index" class="card">
          <div class="mr-6">
            <span class="icon">
              <img :src="feature.icon" />
            </span>
          </div>

          <div>
            <div class="title">{{ feature.title }}</div>
            <div class="subtitle">{{ feature.subtitle }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "Features",
};
</script>

<script lang="ts" setup>
const features = ref([
  {
    icon: "/images/head-phone.png",
    title: "音频跟读",
    subtitle: "支持下载/导入各类外语音频，进行解析跟读",
  },
  {
    icon: "/images/camera.png",
    title: "视频跟读",
    subtitle: "支持下载/导入各类外语视频，进行解析跟读",
  },
  {
    icon: "/images/lang.png",
    title: "外语阅读",
    subtitle: "支持下载/导入各类外语文章，进行解析跟读",
  },
  {
    icon: "/images/robot.png",
    title: "AI自然对话",
    subtitle: "说你想说的，跟AI一起复读学习",
  },
  {
    icon: "/images/note.png",
    title: "重温笔记",
    subtitle: "学习遇到难点？先添加笔记，再巩固复习",
  },
  {
    icon: "/images/book.png",
    title: "词典助记",
    subtitle: "学习遇到生词？添加到生词本，再巩固复习",
  },
  {
    icon: "/images/cham.png",
    title: "社区竞赛",
    subtitle: "每日、每周、每月都有人跟你一起学习进步",
  },
]);
</script>

<style lang="scss" scoped>
.features {
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
      font-size: 14px;
      font-style: italic;
      font-weight: 400;
      text-align: right;
    }
  }

  .cards {
    display: grid;
    gap: 48px;
    margin-top: 32px;

    .card {
      display: flex;

      .icon {
        display: inline-block;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .title {
        margin-bottom: 16px;
        font-size: 20px;
        font-weight: 500;
      }

      .subtitle {
        color: #979797;
        font-size: 14px;
        font-weight: 400;
      }
    }

    .compitition {
      color: #fff;
      background-image: url("/images/bg-features.png");
      background-repeat: no-repeat;
      background-size: cover;
      position: relative;
      overflow: hidden;

      &::after {
        content: "";
        position: absolute;
        top: 48px;
        right: -20px;
        width: 824px;
        height: 448px;
        background-image: url("/images/rank.png");
      }
    }
  }
}
</style>
