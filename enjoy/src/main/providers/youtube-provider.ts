import log from "@main/logger";
import $ from "cheerio";
import { WebContentsView, ipcMain } from "electron";

const logger = log.scope("providers/youtube-provider");

export class YoutubeProvider {
  scrape = async (url: string) => {
    return new Promise<string>((resolve, reject) => {
      const view = new WebContentsView();
      view.webContents.loadURL(url);
      logger.debug("started scraping", url);

      view.webContents.on("did-finish-load", () => {
        logger.debug("finished scraping", url);
        view.webContents
          .executeJavaScript(`document.documentElement.innerHTML`)
          .then((html) => resolve(html as string))
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
      const json = $.load(html)("script")
        .text()
        .match(/ytInitialData = ({.*?});/)[1];
      const data = JSON.parse(json);

      const videoContents =
        data.contents.twoColumnBrowseResultsRenderer.tabs[1].tabRenderer.content
          .richGridRenderer.contents;

      const videoList = videoContents
        .filter((i: any) => i.richItemRenderer)
        .map((video: any) => {
          return {
            title:
              video.richItemRenderer.content.videoRenderer.title.runs[0].text,
            thumbnail:
              video.richItemRenderer.content.videoRenderer.thumbnail
                .thumbnails[0].url,
            videoId: video.richItemRenderer.content.videoRenderer.videoId,
            duration:
              video.richItemRenderer.content.videoRenderer.lengthText
                .simpleText,
          };
        });

      return videoList;
    } catch (e) {
      logger.error(e);
      return [];
    }
  };

  videos = async () => {
    const html = await this.scrape("https://www.youtube.com/@CNN/videos");
    return this.extractVideos(html);
  };

  registerIpcHandlers = () => {
    ipcMain.handle("youtube-provider-videos", async () => {
      try {
        return await this.videos();
      } catch (error) {
        logger.error(error);
      }
    });
  };
}
