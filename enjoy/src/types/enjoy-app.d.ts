type EnjoyAppType = {
  app: {
    reset: () => Promise<void>;
    resetSettings: () => Promise<void>;
    relaunch: () => Promise<void>;
    reload: () => Promise<void>;
    isPackaged: () => Promise<boolean>;
    apiUrl: () => Promise<string>;
    quit: () => Promise<void>;
    openDevTools: () => Promise<void>;
    createIssue: (title: string, body: string) => Promise<void>;
    version: string;
  };
  system: {
    preferences: {
      mediaAccess: (mediaType: "microphone") => Promise<boolean>;
    };
  };
  providers: {
    audible: {
      bestsellers: (params?: {
        page?: number;
        category?: number;
        pageSize?: number;
      }) => Promise<{
        books: AudibleBookType[];
        page: number;
        nextPage: number | undefined;
      }>;
    };
    ted: {
      talks: () => Promise<TedTalkType[]>;
      ideas: () => Promise<TedIdeaType[]>;
      downloadTalk: (url: string) => Promise<{ audio: string; video: string }>;
    };
  };
  view: {
    load: (
      url: string,
      bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      },
      options?: {
        navigatable?: boolean;
      }
    ) => Promise<void>;
    show: (bounds: object) => Promise<void>;
    hide: () => Promise<void>;
    remove: () => Promise<void>;
    scrape: (url: string) => Promise<void>;
    onViewState: (
      callback: (
        event,
        state: { state: string; error?: string; url?: string; html?: string }
      ) => void
    ) => void;
    removeViewStateListeners: () => void;
  };
  onNotification: (
    callback: (event, notification: NotificationType) => void
  ) => void;
  shell: {
    openExternal: (url: string) => Promise<void>;
    openPath: (path: string) => Promise<void>;
  };
  dialog: {
    showOpenDialog: (
      options: Electron.OpenDialogOptions
    ) => Promise<string[] | undefined>;
    showSaveDialog: (
      options: Electron.SaveDialogOptions
    ) => Promise<Electron.SaveDialogReturnValue>;
    showMessageBox: (
      options: Electron.MessageBoxOptions
    ) => Promise<Electron.MessageBoxReturnValue>;
    showErrorBox: (title: string, content: string) => Promise<void>;
  };
  settings: {
    getLibrary: () => Promise<string>;
    setLibrary: (library: string) => Promise<void>;
    getUser: () => Promise<UserType>;
    setUser: (user: UserType) => Promise<void>;
    getUserDataPath: () => Promise<string>;
    getLlm: (provider: SupportedLlmProviderType) => Promise<LlmProviderType>;
    setLlm: (
      provider: SupportedLlmProviderType,
      LlmProviderType
    ) => Promise<void>;
    getLanguage: () => Promise<string>;
    switchLanguage: (language: string) => Promise<void>;
  };
  fs: {
    ensureDir: (path: string) => Promise<boolean>;
  };
  path: {
    join: (...paths: string[]) => Promise<string>;
  };
  db: {
    init: () => Promise<DbState>;
    onTransaction: (
      callback: (event, state: TransactionStateType) => void
    ) => Promise<void>;
    removeListeners: () => Promise<void>;
  };
  audios: {
    findAll: (params: object) => Promise<AudioType[]>;
    findOne: (params: object) => Promise<AudioType>;
    create: (uri: string, params?: object) => Promise<AudioType>;
    update: (id: string, params: object) => Promise<AudioType | undefined>;
    destroy: (id: string) => Promise<undefined>;
    transcribe: (id: string) => Promise<void>;
    upload: (id: string) => Promise<void>;
  };
  videos: {
    findAll: (params: object) => Promise<VideoType[]>;
    findOne: (params: object) => Promise<VideoType>;
    create: (uri: string, params?: any) => Promise<VideoType>;
    update: (id: string, params: any) => Promise<VideoType | undefined>;
    destroy: (id: string) => Promise<undefined>;
    transcribe: (id: string) => Promise<void>;
    upload: (id: string) => Promise<void>;
  };
  recordings: {
    findAll: (where: object) => Promise<RecordingType[]>;
    findOne: (where: object) => Promise<RecordingType>;
    create: (params: object) => Promise<RecordingType>;
    update: (id: string, params: object) => Promise<RecordingType | undefined>;
    destroy: (id: string) => Promise<void>;
    upload: (id: string) => Promise<void>;
    assess: (id: string) => Promise<void>;
    stats: (params: { from: string; to: string }) => Promise<{
      count: number;
      duration: number;
    }>;
    groupByDate: (params: { from: string; to: string }) => Promise<
      {
        date: string;
        count: number;
        level?: number;
      }[]
    >;
    groupByTarget: (params: { from: string; to: string }) => Promise<
      {
        date: string;
        targetId: string;
        targetType: string;
        count: number;
        duration: number;
        target: AudioType | VideoType;
      }[]
    >;
    groupBySegment: (
      targetId: string,
      targetType
    ) => Promise<SegementRecordingStatsType>;
  };
  conversations: {
    findAll: (params: any) => Promise<ConversationType[]>;
    findOne: (params: any) => Promise<ConversationType>;
    create: (params: any) => Promise<ConversationType>;
    update: (id: string, params: object) => Promise<ConversationType>;
    destroy: (id: string) => Promise<void>;
    ask: (
      id: string,
      params: {
        messageId?: string;
        content?: string;
        file?: string;
        blob?: {
          type: string;
          arrayBuffer: ArrayBuffer;
        };
      }
    ) => Promise<MessageType[]>;
  };
  messages: {
    findAll: (params: object) => Promise<MessageType[]>;
    findOne: (params: object) => Promise<MessageType>;
    destroy: (id: string) => Promise<void>;
    createSpeech: (id: string, configuration?: any) => Promise<SpeechType>;
  };
  whisper: {
    config: () => Promise<WhisperConfigType>;
    check: () => Promise<{ success: boolean; log: string }>;
    setModel: (model: string) => Promise<WhisperConfigType>;
    setService: (
      service: WhisperConfigType["service"]
    ) => Promise<WhisperConfigType>;
    transcribeBlob: (
      blob: { type: string; arrayBuffer: ArrayBuffer },
      prompt?: string
    ) => Promise<{ file: string; content: string }>;
  };
  ffmpeg: {
    config: () => Promise<FfmpegConfigType>;
    setConfig: (config: FfmpegConfigType) => Promise<FfmpegConfigType>;
    download: () => Promise<FfmpegConfigType>;
    check: () => Promise<boolean>;
    discover: () => Promise<{
      ffmpegPath: string;
      ffprobePath: string;
      scanDirs: string[];
    }>;
  };
  download: {
    onState: (callback: (event, state) => void) => void;
    start: (url: string, savePath?: string) => void;
    cancel: (filename: string) => Promise<void>;
    cancelAll: () => void;
    dashboard: () => Promise<DownloadStateType[]>;
    removeAllListeners: () => void;
  };
  cacheObjects: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any, ttl?: number) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  transcriptions: {
    findOrCreate: (params: any) => Promise<TranscriptionType>;
    process: (params: any, options: any) => Promise<void>;
    update: (id: string, params: any) => Promise<void>;
  };
  waveforms: {
    find: (id: string) => Promise<WaveFormDataType>;
    save: (id: string, data: WaveFormDataType) => Promise<void>;
  };
};
