<template>
  <div class="text-center slogan-section mt-[52px] lg:mt-[82px]">
    <div class="container m-auto mb-2">
      <Logo width="112" height="29" class="inline-block text-primary" />
    </div>

    <div class="mb-3">
      <div
        class="slogan inline-block text-greyscale_2 text-[24px] md:text-[48px] px-6 md:px-12 lg:max-w-[800px]"
      >
        用你的注意力填满一千小时就能练成任何你所需要的技能......
      </div>
    </div>

    <div
      class="hint flex justify-center text-greyscale_4 text-[14px] md:text-[18px]"
    >
      与
      <span class="flex text-greyscale_1 mr-1">
        <img src="/icon/enjoy-app.svg" width="24" height="24" class="mx-1" />
        Enjoy App
      </span>
      一起，享受这1000小时
    </div>

    <div class="mt-6">
      <button
        class="action hover:bg-primary bg-greyscale_2 text-white px-5 py-4 inline-flex rounded-full items-center text-[14px] md:text-[16px]"
      >
        <span class="mr-1">体验 Enjoy App</span>

        <img src="/icon/arrow-right.svg" width="24" />
      </button>
    </div>
  </div>

  <div class="demo mt-[80px] md:mt-[120px] h-[160px] md:h-[300px] lg:h-[600px]">
    <div class="bg h-[160px] md:h-[340px] lg:h-[620px]"></div>

    <div class="container m-auto text-center">
      <img
        class="demo-screen inline w-[312px] md:w-[682px] lg:w-[924px] xl:w-[1024px] mt-[-40px] md:mt-[-60px]"
        src="/images/demo.png"
      />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "Slogan",
};
</script>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.slogan {
  font-family: "Noto Serif SC", sans-serif;
  font-weight: 700;
  line-height: 1.5;
}

.container {
  position: relative;
}

.action {
  transition: ease-in-out 0.2s;
}

.demo {
  position: relative;

  .bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background-image: url("/images/bg-demo.png");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: -1;
  }

  .demo-screen {
    border-radius: 12px;
  }
}
</style>
