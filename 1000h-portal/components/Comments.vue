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
          <div class="content" :style="{ width: item.width + 'px' || 'auto' }">
            {{ item.text }}
          </div>
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
    width: 420,
    mixinId: 39491012,
    avatar: "/portal-static/images/avatar.png",
    name: "刘岩^Box定投践行群7年践碟",
    hint: "专注训练",
    text: "Enjoy 使用非常方便，之前是自己写中文文稿，Enjoy 翻译成英文，再逐句话的跟着学发音和语音语调，直到95分以上，开始按照正确的语音背诵，现在是每天朗读背诵笑来老师整理的英语俚语，惯用语，积攒了好多不熟悉的用法，每天都能学到新东西，每天都有进步，真的感觉充实，感谢笑来老师，让大家一起走在正确的道路上",
  },
  {
    mixinId: 39279749,
    avatar: "/portal-static/images/avatar.png",
    name: "龙小方aytc93",
    hint: "专注训练",
    text: "每天早上5点起床之后，会先用enjoy进行朗读。常用成语特别好，每天读10个，每个有3条语音；语音评估很好用，帮助看出哪个音节需要修正；把1000h上面的手册用enjoy翻译出来，生成语音，一次性准备好一个月的内容，这个文字鼓励我达成每天3小时。",
  },
  {
    width: 420,
    mixinId: 37339898,
    avatar: "/portal-static/images/avatar.png",
    name: "Yvonne",
    hint: "专注训练",
    text: "这些天真实的感受是，练了就是有效果。好多以前完全注意不到的发音细节，都被灵敏识别并且标注出来了。这些天已经产生很大的变化了，在一系列喉舌唇齿的细小动作调整之后，现在得分比刚练的时候障碍小了太多。之前读了多少遍根本数不过来，单是系统记录到的评估次数一天都有四五百遍，但现在，9-10个句子，只用了两百多遍，就能拿到很多99-100这样不错的成绩了。特别提示：一定要特别特别重视评估结果里的颜色标记，及时地被纠正，这帮助太大了。功能里的“句子分析”太强大，直接拆清楚每个句子里的所有成分，对于理解语意、朗读断句、轻重缓急的拿捏，都提供了非常强大的支持。伙伴们加油！",
  },
  {
    mixinId: 37306363,
    avatar: "/portal-static/images/avatar.png",
    name: "京焕",
    hint: "专注训练",
    text: "Enjoy 太强大了！我们一家在韩国生活，孩子们的母语自然是韩语，惊讶于 Enjoy竟然支持韩文语法注释翻译！年初决定带着5年级的老大用 Enjoy练习英语后，果断把课外英语补习班停掉。经过半年的练习，孩子的进步非常明显，在班里英语成绩一直最好，口语更是不像话得好。更何况很多同学们花钱在英语补习班学习。",
  },
  {
    mixinId: 1054922,
    avatar: "/portal-static/images/avatar.png",
    name: "侯亮",
    hint: "专注训练",
    text: "Enjoy 非常好用，它对于我最重要的功能是无限拆分任务，几乎把学英语降低到0，就像小孩子学说话一样简单，最后只剩一个字”练“。如果没学好就是自己练得不够多。感谢Enjoy的开发团队，Enjoy让我欲罢不能。",
  },
  {
    mixinId: 39637034,
    avatar: "/portal-static/images/avatar.png",
    name: "BigGang",
    hint: "专注训练",
    text: "Enjoy 让我们家学习英语口语变得像吃饭一样自然。我和两个孩子用 Enjoy 每天复述小猪佩奇一集，孩子三个月下来口语突飞猛进，孩子幼儿园毕业外教英语老师给了极高的评价。我相信随着我们练习的时间逐渐积累，可能三年或更短时间孩子的英语将完全解锁。Enjoy 是每一位想学习练习英语的神器，非常推荐。",
  },
  {
    mixinId: 37381381,
    avatar: "/portal-static/images/avatar.png",
    name: "杨秀程",
    hint: "专注训练",
    text: "Enjoy 是我的健脑房，在每一个发音动作从笨拙到熟练的过程中，我感到很开心。",
  },
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
      avatar: info.avatar_url || "/portal-static/images/avatar.png",
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
    animation: scroll 90s linear infinite;

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
    transform: translateX(-6309px);
  }
}
</style>
