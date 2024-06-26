<template>
  <div class="price">
    <div class="container m-auto">
      <div class="gap-[48px] grid grid-cols-1 md:grid-cols-2">
        <div class="intro">
          <div class="title text-[20px] md:text-[32px]">增值体验</div>
          <div class="subtitle text-[14px] md:text-[16px]">
            Enjoy App
            会根据使用的功能按量计费，新用户消耗完初期余额后，你可以通过充值来享受更多服务
          </div>

          <div class="items">
            <div v-for="(item, index) in items" :key="index" class="item">
              <span>
                <img src="/portal-static/icon/check.svg" />
              </span>
              <span class="text-[14px] md:text-[16px]">{{ item }}</span>
            </div>
          </div>
        </div>

        <div class="self-center">
          <img
            class="md:h-[356px] lg:hidden"
            src="/portal-static/images/payment.png"
          />

          <img
            class="hidden lg:block"
            src="/portal-static/images/payment-2.png"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "Price",
};
</script>

<script lang="ts" setup>
const items = ref([
  "跟读更多的音频",
  "跟读更多的视频",
  "跟读更多的文章",
  "增加与智能助手的对话次数",
  "更多增值体验开发中",
]);
</script>

<style lang="scss" scoped>
.price {
  margin-top: 126px;
  color: #212121;

  .intro {
    flex-basis: 400px;

    .title {
      line-height: 32px;
      font-weight: 600;
    }

    .subtitle {
      font-weight: 400;
      margin-top: 20px;
    }
  }

  .items {
    margin-top: 32px;

    .item {
      display: flex;
      align-items: center;
      line-height: 1;
      gap: 12px;
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
        color: #979797;
      }
    }
  }
}
</style>
