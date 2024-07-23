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
        <div
          v-for="(item, index) in [...comments, ...comments]"
          :key="index"
          class="item"
        >
          <img class="quote" src="/portal-static/icon/double-quote.svg" />

          <div class="top">
            <span>
              <img
                width="56"
                height="56"
                class="rounded-full"
                :src="item.avatar"
              />
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
import { request } from "@/utils/http";

const items = ref([
  {
    mixinId: 31766,
    avatar: "/portal-static/avatars/31766.jpg",
    name: "阿信",
    hint: "专注训练",
    text: "发现自己发音错误很有帮助，之前是不知不觉，现在注意到了，开始纠正练习。",
  },
  {
    mixinId: 39503702,
    avatar: "/portal-static/avatars/39503702.jpg",
    name: "二十初仲夏的树",
    hint: "专注训练",
    text: "五个月，语感和口语熟练度提高了很多，附带着阅读能力也提高了，感觉读多了以后大胆了很多，估计碰到外国人敢开口了，有时候甚至自己都能小小造句了。",
  },
  {
    mixinId: 37300002,
    avatar: "/portal-static/avatars/37300002.jpg",
    name: "黄明英",
    hint: "专注训练",
    text: "跟着朗读，慢慢有停顿、升调降调感觉。",
  },
  {
    mixinId: 39440639,
    avatar: "/portal-static/avatars/39440639.jpg",
    name: "朱国庆",
    hint: "专注训练",
    text: "App 帮助我解决发音问题，就像一位私人教练，随时纠正发音错误，很多旧的发音习惯得到了纠正，让我的英语发音比之前有了很大的提高。 ",
  },
  {
    mixinId: 40303463,
    avatar: "/portal-static/images/avatar.png",
    name: "东心木",
    hint: "专注训练",
    text: "朗读更流利了，表达更地道了。",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "匿名用户",
    hint: "-",
    text: "在英语方面，提升了发音质量，同时提高了背诵速度及效果；在学习方面，养成了一定的学习习惯，同时也迫使自己不断的输出。",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "匿名用户",
    hint: "-",
    text: "跟着读了这些天，对学英语不再有恐惧感了，仿佛没有读不了的句子了，有这个软件，英语的学习计划也直接提前了。",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "匿名用户",
    hint: "-",
    text: "纠正发音、方便跟读、了解读音的轻重缓急。",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "匿名用户",
    hint: "-",
    text: "纠正了很多过去读错，混淆的音。翻译超快，有语音可以跟读练习真是太好用了！学到了很多自己没想到过的表达方式，还有很多新词。记录自己的练习，也让自身很有成就感，不再担心学英语有什么用，练起来，这个过程就足够有用了！",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "匿名用户",
    hint: "-",
    text: "自动音标生成、逐句跟读功能让练习很方便，快捷键也很好用，口语水平提高了不少。",
  },
  {
    avatar: "/portal-static/images/avatar.png",
    name: "匿名用户",
    hint: "-",
    text: "听力更清晰，特别是在听背的熟练的说法时。",
  },
]);

const infos = ref<any[]>([]);

const comments = computed(() => {
  return items.value.map((item) => {
    const info = infos.value.find((info) => info.mixinId === item.mixinId);

    if (!info) return item;

    const sumHours = Number(info.recordings_duration) / 1000 / 60 / 60;

    return {
      ...item,
      name: info.name,
      avatar: info.avatar_url,
      hint: `专注训练 ${sumHours.toFixed(1)} 小时`,
    };
  });
});

onMounted(async () => {
  requestUserInfo();
});

async function requestUserInfo() {
  infos.value = await Promise.all(
    items.value
      .filter((item) => item.mixinId)
      .map(async (item) => {
        const resp = await request(
          `https://enjoy.bot/api/users/${item.mixinId}/stats`
        );

        return { ...resp, mixinId: item.mixinId };
      })
  );
}
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
    animation: scroll 60s linear infinite;

    &:hover {
      animation-play-state: paused;
    }

    .item {
      padding: 24px;
      border-radius: 4px;
      background: #fff;
      flex: 0 0 340px;
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
    transform: translateX(0);
  }
  100% {
    transform: translateX(-3916px);
  }
}
</style>
