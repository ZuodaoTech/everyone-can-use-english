<template>
  <div class="features mt-[64px] md:mt-[96px] lg:mt-[128px]">
    <div class="container m-auto">
      <div class="top flex justify-between">
        <div class="text-greyscale_1">
          <div class="title text-[20px] md:text-[32px]">特色功能</div>
          <div class="subtitle text-[14px] md:text-[16px]">
            你能想到的，只要是对学习有帮助的功能，我们都实现了。
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
    icon: "/portal-static/images/head-phone.png",
    title: "音频可视化跟读",
    subtitle: "导入的音频，我们会进行解析，提供可视化跟读",
  },
  {
    icon: "/portal-static/images/camera.png",
    title: "视频可视化跟读",
    subtitle: "既然音频可以跟读，视频当然也可以",
  },
  {
    icon: "/portal-static/images/lang.png",
    title: "文章阅读",
    subtitle: "导入各类外语文章，进行解析阅读",
  },
  {
    icon: "/portal-static/images/robot.png",
    title: "AI 自然对话",
    subtitle: "最称职的人工智能外语陪练",
  },
  {
    icon: "/portal-static/images/note.png",
    title: "重温笔记",
    subtitle: "学习遇到难点？先添加笔记，再巩固复习",
  },
  {
    icon: "/portal-static/images/book.png",
    title: "词典助记",
    subtitle: "学习遇到生词？添加到生词本，再巩固复习",
  },
  {
    icon: "/portal-static/images/cham.png",
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
      background-image: url("/portal-static/images/bg-features.png");
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
        background-image: url("/portal-static/images/rank.png");
      }
    }
  }
}
</style>
