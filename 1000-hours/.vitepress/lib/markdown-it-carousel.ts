import type MarkdownIt from "markdown-it/lib/index.mjs";
import * as cheerio from "cheerio";

export default function carouselPlugin(md: MarkdownIt) {
  const html_block = md.renderer.rules.html_block!;

  md.renderer.rules.html_block = (...args) => {
    const [tokens, idx] = args;
    const token = tokens[idx];

    try {
      if (token.content.match(/class=["']carousel["']/)) {
        const $ = cheerio.load(token.content, null, false);
        const carousel = $(".carousel");

        if (carousel) {
          const imgs = Array.from($(".carousel img"))
            .map((item) => {
              const src = $(item).attr("src");
              return `<swiper-slide><img src="${src}" /></swiper-slide>`;
            })
            .join("");

          const template = `
          <div class="carousel">
            <swiper-container class="carousel-inner" thumbs-swiper=".swiper-thumb" space-between="10" navigation="true" pagination="true">
              ${imgs}
            </swiper-container>
            <swiper-container class="swiper-thumb" slides-per-view="4" free-mode="true" space-between="10">
              ${imgs}
            </swiper-container>
          </div>
        `;

          carousel.replaceWith(template);

          return $.html();
        }
      }
    } catch (error) {
      console.log("convert carousel element error");
    }

    return html_block(...args);
  };
}
