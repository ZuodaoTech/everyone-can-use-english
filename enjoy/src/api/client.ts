import axios, { AxiosInstance } from "axios";
import decamelizeKeys from "decamelize-keys";
import camelcaseKeys from "camelcase-keys";

const ONE_MINUTE = 1000 * 60; // 1 minute

export class Client {
  public api: AxiosInstance;
  public baseUrl: string;
  public logger: any;

  constructor(options: {
    baseUrl: string;
    accessToken?: string;
    logger?: any;
  }) {
    const { baseUrl, accessToken, logger } = options;
    this.baseUrl = baseUrl;
    this.logger = logger || console;

    this.api = axios.create({
      baseURL: baseUrl,
      timeout: ONE_MINUTE,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.api.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${accessToken}`;

      this.logger.debug(
        config.method.toUpperCase(),
        config.baseURL + config.url,
        config.data,
        config.params
      );
      return config;
    });
    this.api.interceptors.response.use(
      (response) => {
        this.logger.debug(
          response.status,
          response.config.method.toUpperCase(),
          response.config.baseURL + response.config.url
        );
        return camelcaseKeys(response.data, { deep: true });
      },
      (err) => {
        if (err.response) {
          this.logger.error(
            err.response.status,
            err.response.config.method.toUpperCase(),
            err.response.config.baseURL + err.response.config.url
          );
          this.logger.error(err.response.data);
          return Promise.reject(err.response.data);
        }

        if (err.request) {
          this.logger.error(err.request);
        } else {
          this.logger.error(err.message);
        }

        return Promise.reject(err);
      }
    );
  }

  auth(params: { provider: string; code: string }): Promise<UserType> {
    return this.api.post("/api/sessions", decamelizeKeys(params));
  }

  me(): Promise<UserType> {
    return this.api.get("/api/me");
  }

  rankings(range: "day" | "week" | "month" | "year" | "all" = "day"): Promise<{
    rankings: UserType[];
    range: string;
  }> {
    return this.api.get("/api/users/rankings", { params: { range } });
  }

  posts(params?: { page?: number; items?: number }): Promise<
    {
      posts: PostType[];
    } & PagyResponseType
  > {
    return this.api.get("/api/posts", { params: decamelizeKeys(params) });
  }

  post(id: string): Promise<PostType> {
    return this.api.get(`/api/posts/${id}`);
  }

  createPost(params: { content: string }): Promise<PostType> {
    return this.api.post("/api/posts", decamelizeKeys(params));
  }

  updatePost(id: string, params: { content: string }): Promise<PostType> {
    return this.api.put(`/api/posts/${id}`, decamelizeKeys(params));
  }

  deletePost(id: string): Promise<void> {
    return this.api.delete(`/api/posts/${id}`);
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
  ): Promise<{ successCount: number; errors: string[]; total: number }> {
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
      pendingLookups?: LookupType[];
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

  starStory(storyId: string): Promise<{ starred: boolean }> {
    return this.api.post(`/api/mine/stories`, decamelizeKeys({ storyId }));
  }

  unstarStory(storyId: string): Promise<{ starred: boolean }> {
    return this.api.delete(`/api/mine/stories/${storyId}`);
  }
}
