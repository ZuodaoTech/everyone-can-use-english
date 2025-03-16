type EnjoyAppType = {
  app: {
    getPlatformInfo: () => Promise<PlatformInfo>;
    reset: () => Promise<void>;
    resetSettings: () => Promise<void>;
    relaunch: () => Promise<void>;
    reload: () => Promise<void>;
    isPackaged: () => Promise<boolean>;
    apiUrl: () => Promise<string>;
    wsUrl: () => Promise<string>;
    quit: () => Promise<void>;
    openDevTools: () => Promise<void>;
    createIssue: (title: string, body: string) => Promise<void>;
    onCmdOutput: (callback: (event, output: string) => void) => void;
    removeCmdOutputListeners: () => void;
    checkForUpdates: () => Promise<void>;
    quitAndInstall: () => Promise<void>;
    onUpdater: (
      callback: (
        event: IpcRendererEvent,
        eventType: string,
        args: any[]
      ) => void
    ) => void;
    removeUpdaterListeners: () => void;
    diskUsage: () => Promise<DiskUsageType>;
    version: string;
  };
  window: {
    onChange: (
      callback: (event, state: { event: string; state: any }) => void
    ) => void;
    toggleMaximized: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    maximize: () => Promise<void>;
    unmaximize: () => Promise<void>;
    fullscreen: () => Promise<void>;
    unfullscreen: () => Promise<void>;
    minimize: () => Promise<void>;
    close: () => Promise<void>;
    removeListener: (
      listener: (event: IpcRendererEvent, ...args: any[]) => void
    ) => void;
    removeAllListeners: () => void;
  };
  system: {
    preferences: {
      mediaAccess: (mediaType: "microphone") => Promise<boolean>;
    };
    proxy: {
      get: () => Promise<ProxyConfigType>;
      set: (config: ProxyConfigType) => Promise<void>;
      refresh: () => Promise<void>;
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
    youtube: {
      videos: (channel: string) => Promise<YoutubeVideoType[]>;
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
    show: (bounds?: any) => Promise<void>;
    hide: () => Promise<void>;
    remove: () => Promise<void>;
    scrape: (url: string) => Promise<void>;
    loadCommunity: (
      bounds: { x: number; y: number; width: number; height: number },
      options?: {
        navigatable?: boolean;
        accessToken?: string;
        url?: string;
        ssoUrl?: string;
      }
    ) => Promise<void>;
    resize: (bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) => Promise<void>;
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
  lookup: (
    selection: string,
    context: string,
    position: { x: number; y: number }
  ) => void;
  onLookup: (
    callback: (
      event: IpcRendererEvent,
      selection: string,
      context: string,
      position: { x: number; y: number }
    ) => void
  ) => void;
  offLookup: () => void;
  onTranslate: (
    callback: (
      event,
      selection: string,
      position: { x: number; y: number }
    ) => void
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
    ) => Promise<string | undefined>;
    showMessageBox: (
      options: Electron.MessageBoxOptions
    ) => Promise<Electron.MessageBoxReturnValue>;
    showErrorBox: (title: string, content: string) => Promise<void>;
  };
  userSettings: {
    get: (key: UserSettingKeyEnum) => Promise<any>;
    set: (key: UserSettingKeyEnum, value: any) => Promise<void>;
  };
  config: {
    getLibrary: () => Promise<string>;
    setLibrary: (library: string) => Promise<void>;
    getUser: () => Promise<UserType>;
    setUser: (user: UserType) => Promise<void>;
    getUserDataPath: () => Promise<string>;
    getApiUrl: () => Promise<string>;
    setApiUrl: (url: string) => Promise<void>;
    getSessions: () => Promise<{ id: string; name?: string }[]>;
    getUserSetting: (key: string) => Promise<any>;
    setUserSetting: (key: string, value: any) => Promise<void>;
    get: () => Promise<Config>;
    login: (user?: UserType) => Promise<void>;
    logout: () => Promise<void>;
    onChange: (
      callback: (
        event: IpcRendererEvent,
        state: { type: ConfigEvent; details: Record<string, any> }
      ) => void
    ) => void;
    removeChangeListener: () => void;
  };
  fs: {
    ensureDir: (path: string) => Promise<boolean>;
  };
  path: {
    join: (...paths: string[]) => Promise<string>;
  };
  db: {
    connect: () => Promise<DbState>;
    disconnect: () => Promise<void>;
    onTransaction: (
      callback: (event, state: TransactionStateType) => void
    ) => Promise<void>;
    removeListeners: () => Promise<void>;
  };
  camdict: {
    lookup: (word: string) => Promise<CamdictWordType | null>;
  };
  mdict: {
    remove: (mdict: MDict) => Promise<void>;
    getResource: (key: string, mdict: MDict) => Promise<string | null>;
    lookup: (word: string, mdict: MDict) => Promise<string | null>;
    import: (pathes: string[]) => Promise<MDict>;
  };
  dict: {
    getDicts: () => Promise<Dict[]>;
    remove: (dict: Dict) => Promise<void>;
    getResource: (key: string, dict: Dict) => Promise<string | null>;
    lookup: (word: string, dict: Dict) => Promise<string | null>;
    import: (path: string) => Promise<void>;
  };
  audios: {
    findAll: (params: any) => Promise<AudioType[]>;
    findOne: (params: any) => Promise<AudioType>;
    create: (uri: string, params?: any) => Promise<AudioType>;
    update: (id: string, params: any) => Promise<AudioType | undefined>;
    destroy: (id: string) => Promise<undefined>;
    upload: (id: string) => Promise<void>;
    crop: (
      id: string,
      params: { startTime: number; endTime: number }
    ) => Promise<string>;
    cleanUp: () => Promise<void>;
  };
  videos: {
    findAll: (params: any) => Promise<VideoType[]>;
    findOne: (params: any) => Promise<VideoType>;
    create: (uri: string, params?: any) => Promise<VideoType>;
    update: (id: string, params: any) => Promise<VideoType | undefined>;
    destroy: (id: string) => Promise<undefined>;
    upload: (id: string) => Promise<void>;
    crop: (
      id: string,
      params: { startTime: number; endTime: number }
    ) => Promise<string>;
    cleanUp: () => Promise<void>;
  };
  recordings: {
    findAll: (where: any) => Promise<RecordingType[]>;
    findOne: (where: any) => Promise<RecordingType>;
    sync: (id: string) => Promise<void>;
    syncAll: () => Promise<void>;
    create: (params: any) => Promise<RecordingType>;
    update: (id: string, params: any) => Promise<RecordingType | undefined>;
    destroy: (id: string) => Promise<void>;
    destroyBulk: (where: any) => Promise<void>;
    statsForDeleteBulk: () => Promise<{
      noAssessment: string[];
      scoreLessThan90: string[];
      scoreLessThan80: string[];
      all: string[];
    }>;
    upload: (id: string) => Promise<void>;
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
    export: (targetId: string, targetType: string) => Promise<string>;
  };
  pronunciationAssessments: {
    findAll: (params: any) => Promise<PronunciationAssessmentType[]>;
    findOne: (params: any) => Promise<PronunciationAssessmentType>;
    create: (params: any) => Promise<PronunciationAssessmentType>;
    update: (id: string, params: any) => Promise<PronunciationAssessmentType>;
    destroy: (id: string) => Promise<void>;
  };
  conversations: {
    findAll: (params: any) => Promise<ConversationType[]>;
    findOne: (params: any) => Promise<ConversationType>;
    create: (params: any) => Promise<ConversationType>;
    update: (id: string, params: any) => Promise<ConversationType>;
    destroy: (id: string) => Promise<void>;
    migrate: (id: string) => Promise<void>;
  };
  messages: {
    findAll: (params: any) => Promise<MessageType[]>;
    findOne: (where: any) => Promise<MessageType>;
    createInBatch: (messages: Partial<MessageType>[]) => Promise<void>;
    destroy: (id: string) => Promise<void>;
    createSpeech: (id: string, configuration?: any) => Promise<SpeechType>;
  };
  speeches: {
    findOne: (where: any) => Promise<SpeechType>;
    create: (
      params: {
        sourceId: string;
        sourceType: string;
        text: string;
        section?: number;
        segment?: number;
        configuration: {
          engine: string;
          model: string;
          voice: string;
        };
      },
      blob: {
        type: string;
        arrayBuffer: ArrayBuffer;
      }
    ) => Promise<SpeechType>;
    delete: (id: string) => Promise<void>;
  };
  echogarden: {
    getPackagesDir: () => Promise<string>;
    recognize: (
      input: string,
      options: RecognitionOptions
    ) => Promise<RecognitionResult>;
    align: (
      input: string | Uint8Array,
      transcript: string,
      options?: any
    ) => Promise<AlignmentResult>;
    alignSegments: (
      input: string | Uint8Array,
      timeline: Timeline,
      options?: any
    ) => Promise<Timeline>;
    wordToSentenceTimeline: (
      wordTimeline: Timeline,
      transcript: string,
      language: string
    ) => Promise<Timeline>;
    transcode: (input: string) => Promise<string>;
    check: (options?: any) => Promise<{ success: boolean; log: string }>;
    checkAlign: (options?: any) => Promise<{
      success: boolean;
      log: string;
    }>;
  };
  ffmpeg: {
    check: () => Promise<boolean>;
    transcode: (
      input: string,
      output: string,
      options?: string[]
    ) => Promise<string>;
  };
  decompress: {
    onComplete: (callback: (event, task: DecompressTask) => void) => void;
    onUpdate: (callback: (event, tasks: DecompressTask[]) => void) => void;
    dashboard: () => Promise<DecompressTask[]>;
    removeAllListeners: () => void;
  };
  download: {
    onState: (callback: (event, state) => void) => void;
    start: (url: string, savePath?: string) => Promise<string | undefined>;
    cancel: (filename: string) => Promise<void>;
    pause: (filename: string) => Promis<void>;
    resume: (filename: string) => Promise<void>;
    remove: (filename: string) => Promise<void>;
    cancelAll: () => void;
    dashboard: () => Promise<DownloadStateType[]>;
    removeAllListeners: () => void;
    printAsPdf: (content: string, savePath?: string) => Promise<void>;
  };
  cacheObjects: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any, ttl?: number) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    writeFile: (filename: string, data: Buffer<ArrayBuffer>) => Promise<string>;
  };
  transcriptions: {
    findOrCreate: (params: any) => Promise<TranscriptionType>;
    update: (id: string, params: any) => Promise<void>;
  };
  waveforms: {
    find: (id: string) => Promise<WaveFormDataType>;
    save: (id: string, data: WaveFormDataType) => Promise<void>;
  };
  segments: {
    findAll: (params: any) => Promise<SegmentType[]>;
    find: (id: string) => Promise<SegmentType>;
    create: (params: {
      targetId: string;
      targetType: string;
      segmentIndex: number;
    }) => Promise<SegmentType>;
    sync: (id: string) => Promise<SegmentType>;
  };
  notes: {
    groupByTarget: (params: any) => Promise<any>;
    groupBySegment: (targetId: string, targetType: string) => Promise<any>;
    findAll: (params: any) => Promise<NoteType[]>;
    find: (id: string) => Promise<NoteType>;
    update: (
      id: string,
      params: {
        content: string;
        parameters?: any;
      }
    ) => Promise<NoteType>;
    delete: (id: string) => Promise<void>;
    create: (params: {
      targetId: string;
      targetType: string;
      content: string;
      parameters?: any;
    }) => Promise<NoteType>;
    sync: (id: string) => Promise<NoteType>;
  };
  chats: {
    findAll: (params: any) => Promise<ChatType[]>;
    findOne: (params: any) => Promise<ChatType>;
    create: (params: any) => Promise<ChatType>;
    update: (id: string, params: any) => Promise<ChatType>;
    destroy: (id: string) => Promise<void>;
  };
  chatAgents: {
    findAll: (params: any) => Promise<ChatAgentType[]>;
    findOne: (params: any) => Promise<ChatAgentType>;
    create: (params: any) => Promise<ChatAgentType>;
    update: (id: string, params: any) => Promise<ChatAgentType>;
    destroy: (id: string) => Promise<void>;
  };
  chatMembers: {
    findAll: (params: any) => Promise<ChatMemberType[]>;
    findOne: (params: any) => Promise<ChatMemberType>;
    create: (params: any) => Promise<ChatMemberType>;
    update: (id: string, params: any) => Promise<ChatMemberType>;
    destroy: (id: string) => Promise<void>;
  };
  chatMessages: {
    findAll: (params: any) => Promise<ChatMessageType[]>;
    findOne: (params: any) => Promise<ChatMessageType>;
    create: (params: any) => Promise<ChatMessageType>;
    update: (id: string, params: any) => Promise<ChatMessageType>;
    destroy: (id: string) => Promise<ChatMessageType>;
  };
  documents: {
    findAll: (params?: any) => Promise<DocumentEType[]>;
    findOne: (params: any) => Promise<DocumentEType>;
    create: (params: any) => Promise<DocumentEType>;
    update: (id: string, params: any) => Promise<DocumentEType>;
    destroy: (id: string) => Promise<void>;
    upload: (id: string) => Promise<void>;
    cleanUp: () => Promise<void>;
  };
};
