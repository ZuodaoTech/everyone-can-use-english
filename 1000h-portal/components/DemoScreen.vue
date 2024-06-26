<template>
  <div
    v-if="loaded"
    class="demo-screen w-[312px] md:w-[682px] lg:w-[1024px] top-[-40px] md:top-[-60px]"
  >
    <img class="bg" :src="bg" />

    <div class="content-container">
      <img class="content" :src="content1" />
      <img class="content" :src="content2" />
      <img class="content" :src="content3" />
    </div>

    <img class="bg2" :src="bg2" />

    <div class="sidebar-container">
      <img class="logo" :src="applogo" />
      <img class="sidebar" :src="sidebar" />
      <img class="help" :src="help" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "DemoScreen",
};
</script>

<script lang="ts" setup>
import bg from "~/assets/images/background.png";
import bg2 from "~/assets/images/background2.png";
import content1 from "~/assets/images/content1.png";
import content2 from "~/assets/images/content2.png";
import content3 from "~/assets/images/content3.png";
import applogo from "~/assets/images/applogo.png";
import sidebar from "~/assets/images/sidebar.png";
import help from "~/assets/images/help.png";

const loaded = ref(false);

onMounted(async () => {
  await Promise.all([
    import("~/assets/images/content1.png"),
    import("~/assets/images/content2.png"),
    import("~/assets/images/content3.png"),
    import("~/assets/images/applogo.png"),
    import("~/assets/images/sidebar.png"),
    import("~/assets/images/help.png"),
  ]);

  loaded.value = true;
});
</script>

<style lang="scss" scoped>
@mixin animate {
  --delay: 0s;
  --startY: -80px;
  opacity: 0;
  animation: fadeIn 0.5s calc(var(--delay) + 0.5s) forwards
      cubic-bezier(0.65, 0, 0.35, 1),
    rotateIn 2s var(--delay) cubic-bezier(0.4, 0, 0.2, 1);
}

.demo-screen {
  display: inline-block;
  position: relative;

  img {
    position: absolute;
  }

  .bg {
    --startY: 640px;
    position: relative;
    animation: rotateIn 2s cubic-bezier(0.33, 1, 0.68, 1);
  }

  .bg2 {
    top: 0;
    opacity: 0;
    animation: fadeIn 0.3s 2s forwards linear;
  }

  .sidebar-container {
    .logo {
      top: 5px;
      left: 7px;
    }

    .sidebar {
      top: 17px;
      left: 2px;
    }

    .help {
      width: 35px;
      bottom: 4px;
      left: 2px;
    }

    img {
      --startY: -120px;
      --delay: 0.1s;
      @include animate;
    }
  }

  .content-container {
    animation: fadeOut 0.5s 2s forwards cubic-bezier(0.65, 0, 0.35, 1);

    img {
      left: 56px;
      @include animate;

      &:nth-child(1) {
        --delay: 0.2s;
        width: 240px;
        top: 3px;
      }

      &:nth-child(2) {
        --delay: 0.1s;
        width: 264px;
        top: 71px;
      }

      &:nth-child(3) {
        width: 264px;
        top: 141px;
      }
    }
  }
}

@media (min-width: 768px) {
  .demo-screen {
    .sidebar-container {
      .logo {
        top: 15px;
        left: 12px;
      }

      .sidebar {
        top: 39px;
        left: 3px;
      }

      .help {
        width: 89px;
        bottom: 7px;
        left: 2px;
      }
    }

    .content-container {
      img {
        left: 122px;
        @include animate;

        &:nth-child(1) {
          width: 514px;
          top: 8px;
        }

        &:nth-child(2) {
          width: 576px;
          top: 155px;
        }

        &:nth-child(3) {
          width: 576px;
          top: 307px;
        }
      }
    }
  }
}

@media (min-width: 1024px) {
  .demo-screen {
    .sidebar-container {
      .logo {
        top: 20px;
        left: 20px;
      }

      .sidebar {
        top: 60px;
        left: 5px;
      }

      .help {
        width: 120px;
        bottom: 12px;
        left: 5px;
      }
    }

    .content-container {
      img {
        left: 184px;
        @include animate;

        &:nth-child(1) {
          --delay: 0.2s;
          width: 770px;
          top: 10px;
        }

        &:nth-child(2) {
          --delay: 0.1s;
          width: 864px;
          top: 233px;
        }

        &:nth-child(3) {
          width: 863px;
          top: 461px;
        }
      }
    }
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes rotateIn {
  0% {
    transform: perspective(1200px) rotateX(30deg) translateY(var(--startY));
  }
  75% {
    transform: perspective(1200px) rotateX(1.31deg) translateY(0);
  }
  100% {
    transform: perspective(1200px) rotateX(0deg) translateY(0);
  }
}
</style>
