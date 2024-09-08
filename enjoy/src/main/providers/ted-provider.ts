import log from "@main/logger";
import * as cheerio from "cheerio";
import { WebContentsView, ipcMain } from "electron";

const logger = log.scope("providers/ted-provider");

export class TedProvider {
  scrape = async (url: string) => {
    return new Promise<string>((resolve, _reject) => {
      const view = new WebContentsView();
      view.webContents.loadURL(url);
      logger.debug("started scraping", url);

      view.webContents.on("did-stop-loading", () => {
        logger.debug("finished loading", url);
        view.webContents
          .executeJavaScript(`document.documentElement.innerHTML`)
          .then((html) => resolve(html as string))
          .catch((error) => {
            logger.warn("Failed to scrape", url, error);
            resolve("");
          })
          .finally(() => {
            view.webContents.close();
          });
      });
    });
  };

  extractTalks = async (html: string) => {
    if (!html) return [];

    try {
      const json = cheerio.load(html)("#__NEXT_DATA__").text();
      const data = JSON.parse(json);
      return data.props.pageProps.talks;
    } catch (e) {
      logger.error(e);
      return [];
    }
  };

  extractIdeas = async (html: string) => {
    if (!html) return [];

    const ideas: TedIdeaType[] = [];
    const $ = cheerio.load(html);
    $(".post.block").each((_, el) => {
      const url = $(el).find("a.block-post-link").attr("href");
      const cover = $(el).find("img").attr("src");
      const title = $(el).find("h2.block-entry-title").text();
      const description = $(el).find("p").text();

      if (!url) {
        return;
      }

      ideas.push({
        url,
        cover,
        title,
        description,
      });
    });

    return ideas;
  };

  downloadTalk = async (url: string) => {
    if (!url.match(/https:\/\/(www\.)?ted.com\/talks\/(\S)+/)) {
      logger.error(`Invalid TED talk URL: ${url}`);
      return;
    }

    return new Promise<{ audio: string; video: string }>((resolve, reject) => {
      const view = new WebContentsView();
      view.webContents.loadURL(url);
      logger.debug("started loading", url);

      view.webContents.on("console-message", (_event, _level, message) => {
        logger.debug("view-console-message", message);
      });

      view.webContents.on("did-finish-load", async () => {
        logger.debug("finished loading", url);
        view.webContents
          .executeJavaScript(
            `document.querySelector('.icon-send')?.closest('button')?.click(); 
            new Promise(resolve => setTimeout(() => resolve(document.documentElement.innerHTML), 1000));`,
            true
          )
          .then((html) => {
            const audio = cheerio
              .load(html)(".icon-headphones")
              .closest("a")
              .attr("href");
            const video = cheerio
              .load(html)(".icon-video")
              .closest("a")
              .attr("href");

            logger.debug("extracted", url, audio, video);
            resolve({ audio, video });
          })
          .catch((error) => {
            logger.error("failed extracted", url, error);
            reject();
          })
          .finally(() => {
            view.webContents.close();
          });
      });
      view.webContents.on(
        "did-fail-load",
        (_event, _errorCode, error, validatedURL) => {
          logger.error("failed loading", url, error, validatedURL);
          view.webContents.close();
          reject(error);
        }
      );
    });
  };

  talks = async () => {
    const html = await this.scrape("https://ted.com/talks");
    return this.extractTalks(html);
  };

  ideas = async () => {
    const html = await this.scrape("https://ideas.ted.com");
    return this.extractIdeas(html);
  };

  registerIpcHandlers = () => {
    ipcMain.handle("ted-provider-talks", async () => {
      return await this.talks();
    });

    ipcMain.handle("ted-provider-download-talk", async (_, url) => {
      return await this.downloadTalk(url);
    });

    ipcMain.handle("ted-provider-ideas", async () => {
      return await this.ideas();
    });
  };
}
