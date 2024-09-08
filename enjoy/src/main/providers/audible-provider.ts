import log from "@main/logger";
import * as cheerio from "cheerio";
import { WebContentsView, ipcMain } from "electron";

const logger = log.scope("providers/audible-provider");

export class AudibleProvider {
  baseURL: string;

  constructor() {
    this.baseURL = "https://www.audible.com";
  }

  scrape = async (path: string) => {
    logger.debug(`Scraping ${this.baseURL + path}`);
    return new Promise<string>((resolve, _reject) => {
      const view = new WebContentsView();
      view.webContents.loadURL(this.baseURL + path);
      view.webContents.on("did-stop-loading", () => {
        logger.debug(`Finish loading ${this.baseURL + path}`);
        view.webContents
          .executeJavaScript(`document.documentElement.innerHTML`)
          .then((html) => {
            resolve(html as string);
          })
          .catch((err) => {
            resolve("");
          })
          .finally(() => view.webContents.close());
      });
    });
  };

  extractCategories = async (html: string) => {
    if (!html) return [];

    const categories: { id: number; label: string }[] = [];
    const $ = cheerio.load(html);

    $(".leftSlot a.refinementFormLink").each((_, el) => {
      const id = new URLSearchParams(
        $(el).attr("href")?.split("?")?.pop() ?? ""
      ).get("searchCategory");
      const label = $(el).text()?.trim();

      if (id && label) {
        categories.push({ id: parseInt(id), label });
      }
    });

    return categories;
  };

  extractAudios = async (html: string) => {
    if (!html) return { books: [], hasNextPage: false };

    const books: AudibleBookType[] = [];
    const $ = cheerio.load(html);

    $("li.bc-list-item.productListItem").each((_, el) => {
      const cover = $(el).find("img").attr("src");
      const title = $(el).find("h3.bc-heading a.bc-link").text()?.trim();
      const href = $(el).find("h3.bc-heading a.bc-link").attr("href");
      const url = this.baseURL + new URL(href ?? "", this.baseURL).pathname;
      const subtitle = $(el).find(".subtitle").text()?.trim();
      const author = $(el).find(".authorLabel a.bc-link").text()?.trim();
      const narrator = $(el).find(".narratorLabel a.bc-link").text();
      const language = $(el)
        .find(".languageLabel")
        .text()
        ?.split(":")
        ?.pop()
        ?.trim();
      const sample = $(el).find("button[data-mp3]").attr("data-mp3");

      books.push({
        title,
        subtitle,
        author,
        narrator,
        language,
        cover,
        sample,
        url,
      });
    });

    const hasNextPage =
      cheerio.load(html)(".nextButton a").attr("aria-disabled") !== "true";

    return {
      books,
      hasNextPage,
    };
  };

  bestsellers = async (params?: {
    page?: number;
    category?: number;
    pageSize?: number;
  }) => {
    const { page = 1, category = "", pageSize = 20 } = params || {};

    const html = await this.scrape(
      `/adblbestsellers?searchCategory=${category}&page=${page}&pageSize=${pageSize}`
    );

    const { hasNextPage, books } = await this.extractAudios(html);

    return {
      books,
      page,
      nextPage: hasNextPage ? page + 1 : undefined,
    };
  };

  categories = async () => {
    const html = await this.scrape("/adblbestsellers");

    return this.extractCategories(html);
  };

  registerIpcHandlers = () => {
    ipcMain.handle("audible-provider-categories", async () => {
      return await this.categories();
    });

    ipcMain.handle("audible-provider-bestsellers", async (_, params) => {
      return await this.bestsellers(params);
    });
  };
}
