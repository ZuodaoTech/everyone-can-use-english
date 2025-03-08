<template>
  <div v-if="shouldShow" id="discourse-comments" style="margin-top: 20px"></div>
  <meta name="discourse-username" :content="author" />
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useData } from "vitepress";

const { page, theme } = useData();

const topicId = computed(() => page.value.frontmatter.discourseTopicId);
const author = computed(() => page.value.frontmatter.discourseAuthor);
const discourseUrl = computed(
  () =>
    page.value.frontmatter.discourseUrl ||
    theme.value.discourseUrl ||
    "https://discuss.enjoy.bot/"
);
const shouldShow = computed(() => !!topicId.value || !!author.value);

onMounted(() => {
  if (shouldShow.value) {
    const options = {
      discourseUrl: discourseUrl.value,
    };
    if (topicId.value) {
      options.topicId = topicId.value;
    } else {
      options.discourseEmbedUrl = new URL(
        window.location.pathname,
        window.location.origin
      ).toString();
    }
    window.DiscourseEmbed = options;

    const d = document.createElement("script");
    d.type = "text/javascript";
    d.async = true;
    d.src = window.DiscourseEmbed.discourseUrl + "javascripts/embed.js";
    (
      document.getElementsByTagName("head")[0] ||
      document.getElementsByTagName("body")[0]
    ).appendChild(d);
  }
});
</script>
