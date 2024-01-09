import { ipcMain } from "electron";
import axios, { AxiosInstance } from "axios";
import { WEB_API_URL } from "@/constants";
import settings from "@main/settings";
import log from "electron-log/main";
import decamelizeKeys from "decamelize-keys";
import camelcaseKeys from "camelcase-keys";

const logger = log.scope("web-api");
const ONE_MINUTE = 1000 * 60; // 1 minute
class WebApi {
  public api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.WEB_API_URL || WEB_API_URL,
      timeout: ONE_MINUTE,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.api.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${settings.getSync(
        "user.accessToken"
      )}`;

      logger.info(
        config.method.toUpperCase(),
        config.baseURL + config.url,
        config.data,
        config.params
      );
      return config;
    });
    this.api.interceptors.response.use(
      (response) => {
        logger.info(
          response.status,
          response.config.method.toUpperCase(),
          response.config.baseURL + response.config.url
        );
        return camelcaseKeys(response.data, { deep: true });
      },
      (err) => {
        if (err.response) {
          logger.error(
            err.response.status,
            err.response.config.method.toUpperCase(),
            err.response.config.baseURL + err.response.config.url
          );
          logger.error(err.response.data);
          return Promise.reject(err.response.data);
        }

        if (err.request) {
          logger.error(err.request);
        } else {
          logger.error(err.message);
        }

        return Promise.reject(err);
      }
    );
  }

  me() {
    return this.api.get("/api/me");
  }

  auth(params: { provider: string; code: string }): Promise<UserType> {
    return this.api.post("/api/sessions", decamelizeKeys(params));
  }

  syncAudio(audio: Partial<AudioType>) {
    return this.api.post("/api/mine/audios", decamelizeKeys(audio));
  }

  syncVideo(video: Partial<VideoType>) {
    return this.api.post("/api/mine/videos", decamelizeKeys(video));
  }

  syncTranscription(transcription: Partial<TranscriptionType>) {
    return this.api.post("/api/transcriptions", decamelizeKeys(transcription));
  }

  syncRecording(recording: Partial<RecordingType>) {
    if (!recording) return;

    return this.api.post("/api/mine/recordings", decamelizeKeys(recording));
  }

  generateSpeechToken(): Promise<{ token: string; region: string }> {
    return this.api.post("/api/speech/tokens");
  }

  syncPronunciationAssessment(
    pronunciationAssessment: Partial<PronunciationAssessmentType>
  ) {
    if (!pronunciationAssessment) return;

    return this.api.post(
      "/api/mine/pronunciation_assessments",
      decamelizeKeys(pronunciationAssessment)
    );
  }

  recordingAssessment(id: string) {
    return this.api.get(`/api/mine/recordings/${id}/assessment`);
  }

  lookup(params: {
    word: string;
    context: string;
    sourceId?: string;
    sourceType?: string;
  }): Promise<LookupType> {
    return this.api.post("/api/lookups", decamelizeKeys(params));
  }

  lookupInBatch(
    lookups: {
      word: string;
      context: string;
      sourceId?: string;
      sourceType?: string;
    }[]
  ): Promise<{ successCount: number; total: number }> {
    return this.api.post("/api/lookups/batch", {
      lookups: decamelizeKeys(lookups, { deep: true }),
    });
  }

  extractVocabularyFromStory(storyId: string): Promise<string[]> {
    return this.api.post(`/api/stories/${storyId}/extract_vocabulary`);
  }

  storyMeanings(
    storyId: string,
    params?: {
      page?: number;
      items?: number;
      storyId?: string;
    }
  ): Promise<
    {
      meanings: MeaningType[];
    } & PagyResponseType
  > {
    return this.api.get(`/api/stories/${storyId}/meanings`, {
      params: decamelizeKeys(params),
    });
  }

  mineMeanings(params?: {
    page?: number;
    items?: number;
    sourceId?: string;
    sourceType?: string;
    status?: string;
  }): Promise<
    {
      meanings: MeaningType[];
    } & PagyResponseType
  > {
    return this.api.get("/api/mine/meanings", {
      params: decamelizeKeys(params),
    });
  }

  createStory(params: CreateStoryParamsType): Promise<StoryType> {
    return this.api.post("/api/stories", decamelizeKeys(params));
  }

  story(id: string): Promise<StoryType> {
    return this.api.get(`/api/stories/${id}`);
  }

  stories(params?: { page: number }): Promise<
    {
      stories: StoryType[];
    } & PagyResponseType
  > {
    return this.api.get("/api/stories", { params: decamelizeKeys(params) });
  }

  mineStories(params?: { page: number }): Promise<
    {
      stories: StoryType[];
    } & PagyResponseType
  > {
    return this.api.get("/api/mine/stories", {
      params: decamelizeKeys(params),
    });
  }

  starStory(storyId: string) {
    return this.api.post(`/api/mine/stories`, decamelizeKeys({ storyId }));
  }

  unstarStory(storyId: string) {
    return this.api.delete(`/api/mine/stories/${storyId}`);
  }

  registerIpcHandlers() {
    ipcMain.handle("web-api-auth", async (event, params) => {
      return this.auth(params)
        .then((user) => {
          return user;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle("web-api-me", async (event) => {
      return this.me()
        .then((user) => {
          return user;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle("web-api-lookup", async (event, params) => {
      return this.lookup(params)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle("web-api-lookup-in-batch", async (event, params) => {
      return this.lookupInBatch(params)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle("web-api-mine-meanings", async (event, params) => {
      return this.mineMeanings(params)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle("web-api-create-story", async (event, params) => {
      return this.createStory(params)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle(
      "web-api-extract-vocabulary-from-story",
      async (event, storyId) => {
        return this.extractVocabularyFromStory(storyId)
          .then((response) => {
            return response;
          })
          .catch((error) => {
            event.sender.send("on-notification", {
              type: "error",
              message: error.message,
            });
          });
      }
    );

    ipcMain.handle(
      "web-api-story-meanings",
      async (event, storyId, params) => {
        return this.storyMeanings(storyId, params)
          .then((response) => {
            return response;
          })
          .catch((error) => {
            event.sender.send("on-notification", {
              type: "error",
              message: error.message,
            });
          });
      }
    );

    ipcMain.handle("web-api-stories", async (event, params) => {
      return this.stories(params)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle("web-api-story", async (event, id) => {
      return this.story(id)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle("web-api-mine-stories", async (event, params) => {
      return this.mineStories(params)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle("web-api-star-story", async (event, id) => {
      return this.starStory(id)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });

    ipcMain.handle("web-api-unstar-story", async (event, id) => {
      return this.unstarStory(id)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          event.sender.send("on-notification", {
            type: "error",
            message: error.message,
          });
        });
    });
  }
}

export default new WebApi();
