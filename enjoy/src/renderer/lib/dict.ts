import * as cheerio from "cheerio";

const MIME: Record<string, string> = {
  css: "text/css",
  img: "image",
  jpg: "image/jpeg",
  png: "image/png",
  spx: "audio/x-speex",
  wav: "audio/wav",
  mp3: "audio/mp3",
  js: "text/javascript",
};

export class DictDefinitionNormalizer {
  $: cheerio.CheerioAPI;
  urls: string[] = [];
  onInjectScript: (url: string) => void;
  onReadResource: (key: string) => Promise<string>;

  constructor({
    onInjectScript,
    onReadResource,
  }: {
    onInjectScript: (url: string) => void;
    onReadResource: (key: string) => Promise<string>;
  }) {
    this.onInjectScript = onInjectScript;
    this.onReadResource = onReadResource;
  }

  async createUrl(mime: string, data: string) {
    if (!data) return "";

    const resp = await fetch(`data:${mime};base64,${data}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);

    this.urls.push(url);

    return url;
  }

  async normalizeImages() {
    return Promise.all(
      this.$("img[src]")
        .toArray()
        .map(async (img) => {
          const $img = this.$(img);
          const src = $img.attr("src");
          const paths = /^file:\/\/(.*)/.exec(src);
          const key = paths ? paths[1] : src;
          const data = await this.onReadResource(key);
          const url = await this.createUrl(MIME["img"], data);

          $img.attr("src", url).attr("_src", src);
        })
    );
  }

  async normalizeStyles() {
    return Promise.all(
      this.$("link[rel=stylesheet]")
        .toArray()
        .map(async (link) => {
          const $link = this.$(link);
          const href = $link.attr("href");

          if (href.startsWith("/assets/styles")) {
            return;
          }

          const data = await this.onReadResource(href);
          const url = await this.createUrl(MIME["css"], data);

          $link.replaceWith(
            this.$("<style scoped>").text('@import url("' + url + '")')
          );
        })
    );
  }

  async normalizeScripts() {
    const hrefs = this.$("script[src]")
      .toArray()
      .map((script) => this.$(script).attr("src"));

    for (const href of hrefs) {
      const data = await this.onReadResource(href);
      const url = await this.createUrl(MIME["js"], data);

      this.onInjectScript(url);
    }
  }

  async normalizeAudios() {
    return Promise.all(
      this.$('a[href^="sound://"]')
        .toArray()
        .map((link) => {
          const $link = this.$(link);
          const href = $link.attr("_href") || $link.attr("href").substring(8);

          $link.attr("data-type", "audio").attr("data-source", href);
        })
    );
  }

  async normalizeInternalLink() {
    return Promise.all(
      [
        ...this.$('a[href^="entry://"]').toArray(),
        ...this.$('a[href^="bword://"]').toArray(),
      ].map((link) => {
        const $link = this.$(link);

        const href = $link.attr("_href") || $link.attr("href").substring(8);
        const [word, hash] = href.split("#");

        if (word) {
          $link
            .attr("data-type", "jump")
            .attr("data-word", word)
            .attr("data-hash", hash);
        }
      })
    );
  }

  async normalize(definition: string) {
    this.$ = cheerio.load(definition, null, false);

    await this.normalizeImages();
    await this.normalizeStyles();
    await this.normalizeScripts();
    await this.normalizeAudios();
    await this.normalizeInternalLink();

    return this.$.html();
  }

  revoke() {
    this.urls.map((url) => {
      URL.revokeObjectURL(url);
    });
  }
}
