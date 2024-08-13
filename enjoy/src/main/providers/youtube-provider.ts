import log from "@main/logger";
import * as cheerio from "cheerio";
import { WebContentsView, ipcMain } from "electron";

const logger = log.scope("providers/youtube-provider");

export class YoutubeProvider {
  scrape = async (url: string) => {
    return new Promise<string>((resolve, reject) => {
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
      view.webContents.on(
        "did-fail-load",
        (_event, _errorCode, error, validatedURL) => {
          logger.warn("failed scraping", url, error, validatedURL);
          view.webContents.close();
          reject();
        }
      );
    });
  };

  extractVideos = async (html: string) => {
    try {
      const json = cheerio
        .load(html)("script")
        .text()
        .match(/ytInitialData = ({.*?});/)[1];
      const data = JSON.parse(json);

      const videoContents =
        data.contents.twoColumnBrowseResultsRenderer.tabs[1].tabRenderer.content
          .richGridRenderer.contents;

      const videoList = videoContents
        .filter((i: any) => i.richItemRenderer)
        .map((video: any) => {
          const thumbnails =
            video.richItemRenderer.content.videoRenderer.thumbnail.thumbnails;

          return {
            title:
              video.richItemRenderer.content.videoRenderer.title.runs[0].text,
            thumbnail: thumbnails[thumbnails.length - 1].url,
            videoId: video.richItemRenderer.content.videoRenderer.videoId,
            duration:
              video.richItemRenderer.content.videoRenderer.lengthText
                ?.simpleText,
          };
        });

      return videoList;
    } catch (e) {
      logger.error(e);
      return [];
    }
  };

  videos = async (channel: string) => {
    const html = await this.scrape(`https://www.youtube.com/${channel}/videos`);
    return this.extractVideos(html);
  };

  registerIpcHandlers = () => {
    ipcMain.handle(
      "youtube-provider-videos",
      async (_event, channel: string) => {
        try {
          return await this.videos(channel);
        } catch (error) {
          logger.error(error);
        }
      }
    );
  };
}
