<template>
  <div
    class="comments mt-[64px] md:mt-[96px] pb-[32px] md:pb-[64px] lg:mt-[128px]"
  >
    <div class="container m-auto">
      <div class="top py-[32px] md:py-[64px] text-center">
        <div class="hint text-[13px] md:text-[14px]">Comment</div>
        <div class="title text-[24px] md:text-[32px]">用户评价</div>
      </div>
    </div>

    <div class="items-container">
      <div class="items">
        <div v-for="(item, index) in items" :key="index" class="item">
          <img class="quote" src="/portal-static/icon/double-quote.svg" />

          <div class="top">
            <span>
              <img width="56" height="56" :src="item.avatar" />
            </span>

            <div class="ml-3">
              <div class="name">{{ item.name }}</div>
              <div class="hint">{{ item.hint }}</div>
            </div>
          </div>
          <div class="content">{{ item.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "Comments",
};
</script>

<script lang="ts" setup>
const items = ref([
  {
    avatar: "/portal-static/images/avatar.png",
    name: "花开富贵",
    hint: "连续打卡 1,000 天",
    text: "这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "花开富贵",
    hint: "连续打卡 1,000 天",
    text: "这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "花开富贵",
    hint: "连续打卡 1,000 天",
    text: "这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "花开富贵",
    hint: "连续打卡 1,000 天",
    text: "这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "花开富贵",
    hint: "连续打卡 1,000 天",
    text: "这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "花开富贵",
    hint: "连续打卡 1,000 天",
    text: "这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "花开富贵",
    hint: "连续打卡 1,000 天",
    text: "这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App这是一个非常好的App",
  },
]);
</script>

<style lang="scss" scoped>
.comments {
  background: linear-gradient(180deg, #e6f0f9 0%, #fff 100%);
  background-repeat: no-repeat;
  background-size: cover;

  > .container .top {
    .title {
      font-weight: 600;
      color: #3e5c77;
    }

    .hint {
      font-family: "New York";
      font-style: italic;
      font-weight: 400;
      opacity: 0.5;
      color: #3e5c77;
    }
  }

  .items-container {
    overflow: hidden;
    padding: 0 24px;
  }

  .items {
    display: flex;
    flex-wrap: nowrap;
    gap: 16px;
    animation: scroll 30s linear infinite;

    .item {
      padding: 24px;
      border-radius: 4px;
      background: #fff;
      min-width: 340px;
      position: relative;

      .quote {
        position: absolute;
        right: 24px;
        top: 32px;
        width: 24px;
      }

      .top {
        display: flex;
        align-items: center;

        .name {
          font-size: 16px;
          font-weight: 500;
        }

        .hint {
          font-size: 12px;
          font-weight: 400;
          opacity: 0.6;
          margin-top: 6px;
        }
      }

      .content {
        margin-top: 30px;
        font-weight: 400;
        line-height: 150%;
      }
    }
  }
}

@keyframes scroll {
  0% {
    transform: translateX(20%);
  }
  100% {
    transform: translateX(-80%);
  }
}
</style>
