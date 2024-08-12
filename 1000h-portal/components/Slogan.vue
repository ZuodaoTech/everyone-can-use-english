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
        <img
          src="/portal-static/icon/enjoy-app.svg"
          width="24"
          height="24"
          class="mx-1"
        />
        Enjoy App
      </span>
      一起，享受这1000小时
    </div>

    <div class="mt-6 max-sm:inline-flex max-sm:gap-4 max-sm:flex-col">
      <a href="https://1000h.org/intro.html" target="_blank">
        <button
          class="action px-4 py-3 md:px-5 md:py-4 text-[14px] md:text-[16px] max-sm:w-[260px]"
        >
          <span class="mr-1">开启我的 1000 小时</span>

          <img src="/portal-static/icon/arrow-right.svg" width="24" />
        </button>
      </a>

      <a href="https://1000h.org/enjoy-app/install.html" target="_blank">
        <button
          class="action secondary px-4 py-3 md:px-5 md:py-4 text-[14px] md:text-[16px] sm:ml-4 max-sm:w-[260px]"
        >
          <span class="mr-1">体验 Enjoy App</span>
        </button>
      </a>
    </div>

    <div class="mt-6 text-greyscale_4 text-[14px] md:text-[18px] total-hour">
      <span v-show="totalHour">
        社区成员已累计练习 {{ totalHourText }} 小时
      </span>
    </div>
  </div>

  <div class="demo mt-[80px] md:mt-[120px] h-[160px] md:h-[300px] lg:h-[600px]">
    <div class="bg h-[160px] md:h-[340px] lg:h-[620px]"></div>

    <div class="container m-auto text-center">
      <DemoScreen />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "Slogan",
};
</script>

<script lang="ts" setup>
const totalHour = ref(0);

const totalHourText = computed(() => totalHour.value.toLocaleString());

onMounted(() => {
  requestTotalPracticeTime();
});

async function requestTotalPracticeTime() {
  await fetch("https://enjoy.bot/api/badges/recordings")
    .then((res) => res.json())
    .then((data) => {
      totalHour.value = Number.parseInt(data.message.replace("h", ""));
    });
}
</script>

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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #252525;
  color: white;
  border-radius: 9999px;

  &:hover {
    background: #4797f5;
  }
}

.action.secondary {
  border: 2px solid #252525;
  color: #252525;
  background: white;

  &:hover {
    color: #4797f5;
    border-color: #4797f5;
  }
}

.total-hour {
  transition: all ease 0.5s;
  height: 28px;
  line-height: 28px;
  transition: all ease 0.5s;
}

.demo {
  position: relative;

  .bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background-image: url("/portal-static/images/bg-demo.png");
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
