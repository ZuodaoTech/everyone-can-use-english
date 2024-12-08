// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { version } from "../package.json";
import { Timeline } from "echogarden/dist/utilities/Timeline";
import {
  type AlignmentOptions,
  type RecognitionOptions,
} from "echogarden/dist/api/API";

contextBridge.exposeInMainWorld("__ENJOY_APP__", {
  app: {
    getPlatformInfo: () => {
      return ipcRenderer.invoke("app-platform-info");
    },
    reset: () => {
      ipcRenderer.invoke("app-reset");
    },
    resetSettings: () => {
      ipcRenderer.invoke("app-reset-settings");
    },
    relaunch: () => {
      ipcRenderer.invoke("app-relaunch");
    },
    reload: () => {
      ipcRenderer.invoke("app-reload");
    },
    isPackaged: () => {
      return ipcRenderer.invoke("app-is-packaged");
    },
    apiUrl: () => {
      return ipcRenderer.invoke("app-api-url");
    },
    wsUrl: () => {
      return ipcRenderer.invoke("app-ws-url");
    },
    quit: () => {
      ipcRenderer.invoke("app-quit");
    },
    checkForUpdates: () => {
      ipcRenderer.invoke("app-check-for-updates");
    },
    quitAndInstall: () => {
      ipcRenderer.invoke("app-quit-and-install");
    },
    onUpdater: (
      callback: (
        event: IpcRendererEvent,
        eventType: string,
        args: any[]
      ) => void
    ) => ipcRenderer.on("app-on-updater", callback),
    removeUpdaterListeners: () => {
      ipcRenderer.removeAllListeners("app-on-updater");
    },
    openDevTools: () => {
      ipcRenderer.invoke("app-open-dev-tools");
    },
    createIssue: (title: string, body: string) => {
      return ipcRenderer.invoke("app-create-issue", title, body);
    },
    onCmdOutput: (
      callback: (event: IpcRendererEvent, data: string) => void
    ) => {
      ipcRenderer.on("app-on-cmd-output", callback);
    },
    removeCmdOutputListeners: () => {
      ipcRenderer.removeAllListeners("app-on-cmd-output");
    },
    diskUsage: () => {
      return ipcRenderer.invoke("app-disk-usage");
    },
    version,
  },
  window: {
    isFullScreen: () => {
      return ipcRenderer.invoke("window-is-full-screen");
    },
    toggleFullscreen: () => {
      return ipcRenderer.invoke("window-fullscreen");
    },
    isMaximized: () => {
      return ipcRenderer.invoke("window-is-maximized");
    },
    toggleMaximized: () => {
      return ipcRenderer.invoke("window-toggle-maximized");
    },
    maximize: () => {
      return ipcRenderer.invoke("window-maximize");
    },
    unmaximize: () => {
      return ipcRenderer.invoke("window-unmaximize");
    },
    fullscreen: () => {
      return ipcRenderer.invoke("window-fullscreen");
    },
    unfullscreen: () => {
      return ipcRenderer.invoke("window-unfullscreen");
    },
    minimize: () => {
      return ipcRenderer.invoke("window-minimize");
    },
    close: () => {
      return ipcRenderer.invoke("window-close");
    },
    onChange: (
      callback: (
        event: IpcRendererEvent,
        state: { event: string; state: any }
      ) => void
    ) => ipcRenderer.on("window-on-change", callback),
    removeListener: (
      listener: (event: IpcRendererEvent, ...args: any[]) => void
    ) => {
      ipcRenderer.removeListener("window-on-change", listener);
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners("window-on-change");
    },
  },
  system: {
    preferences: {
      mediaAccess: (mediaType: "microphone" | "camera") => {
        return ipcRenderer.invoke("system-preferences-media-access", mediaType);
      },
    },
    proxy: {
      get: () => {
        return ipcRenderer.invoke("system-proxy-get");
      },
      set: (config: ProxyConfigType) => {
        return ipcRenderer.invoke("system-proxy-set", config);
      },
      refresh: () => {
        return ipcRenderer.invoke("system-proxy-refresh");
      },
    },
  },
  providers: {
    audible: {
      categories: () => {
        return ipcRenderer.invoke("audible-provider-categories");
      },
      bestsellers: (params: {
        category?: string;
        page?: number;
        pageSize?: number;
      }) => {
        return ipcRenderer.invoke("audible-provider-bestsellers", params);
      },
    },
    ted: {
      talks: () => {
        return ipcRenderer.invoke("ted-provider-talks");
      },
      ideas: () => {
        return ipcRenderer.invoke("ted-provider-ideas");
      },
      downloadTalk: (url: string) => {
        return ipcRenderer.invoke("ted-provider-download-talk", url);
      },
    },
    youtube: {
      videos: (channel: string) => {
        return ipcRenderer.invoke("youtube-provider-videos", channel);
      },
    },
  },
  view: {
    load: (
      url: string,
      bounds?: { x: number; y: number; width: number; height: number },
      options?: { navigatable?: boolean }
    ) => {
      return ipcRenderer.invoke("view-load", url, bounds, options);
    },
    hide: () => {
      return ipcRenderer.invoke("view-hide");
    },
    remove: () => {
      return ipcRenderer.invoke("view-remove");
    },
    show: (bounds: { x: number; y: number; width: number; height: number }) => {
      return ipcRenderer.invoke("view-show", bounds);
    },
    scrape: (url: string) => {
      return ipcRenderer.invoke("view-scrape", url);
    },
    onViewState: (
      callback: (
        event: IpcRendererEvent,
        state: { state: string; error?: string; url?: string; html?: string }
      ) => void
    ) => ipcRenderer.on("view-on-state", callback),
    removeViewStateListeners: () => {
      ipcRenderer.removeAllListeners("view-on-state");
    },
  },
  onNotification: (
    callback: (event: IpcRendererEvent, notification: NotificationType) => void
  ) => ipcRenderer.on("on-notification", callback),
  lookup: (
    selection: string,
    context: string,
    position: { x: number; y: number }
  ) => ipcRenderer.emit("on-lookup", null, selection, context, position),
  onLookup: (
    callback: (
      event: IpcRendererEvent,
      selection: string,
      context: string,
      position: { x: number; y: number }
    ) => void
  ) => ipcRenderer.on("on-lookup", callback),
  offLookup: () => {
    ipcRenderer.removeAllListeners("on-lookup");
  },
  onTranslate: (
    callback: (
      event: IpcRendererEvent,
      selection: string,
      position: { x: number; y: number }
    ) => void
  ) => ipcRenderer.on("on-translate", callback),
  offTranslate: () => {
    ipcRenderer.removeAllListeners("on-translate");
  },
  shell: {
    openExternal: (url: string) =>
      ipcRenderer.invoke("shell-open-external", url),
    openPath: (path: string) => ipcRenderer.invoke("shell-open-path", path),
  },
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke("dialog-show-open-dialog", options),
    showSaveDialog: (options: Electron.SaveDialogOptions) =>
      ipcRenderer.invoke("dialog-show-save-dialog", options),
    showMessageBox: (options: Electron.MessageBoxOptions) =>
      ipcRenderer.invoke("dialog-show-message-box", options),
    showErrorBox: (title: string, content: string) =>
      ipcRenderer.invoke("dialog-show-error-box", title, content),
  },
  appSettings: {
    get: (key: string) => {
      return ipcRenderer.invoke("app-settings-get", key);
    },
    set: (key: string, value: any) => {
      return ipcRenderer.invoke("app-settings-set", key, value);
    },
    getLibrary: () => {
      return ipcRenderer.invoke("app-settings-get-library");
    },
    setLibrary: (library: string) => {
      return ipcRenderer.invoke("app-settings-set-library", library);
    },
    getSessions: () => {
      return ipcRenderer.invoke("app-settings-get-sessions");
    },
    getUser: () => {
      return ipcRenderer.invoke("app-settings-get-user");
    },
    setUser: (user: UserType) => {
      return ipcRenderer.invoke("app-settings-set-user", user);
    },
    getUserDataPath: () => {
      return ipcRenderer.invoke("app-settings-get-user-data-path");
    },
    getApiUrl: () => {
      return ipcRenderer.invoke("app-settings-get-api-url");
    },
    setApiUrl: (url: string) => {
      return ipcRenderer.invoke("app-settings-set-api-url", url);
    },
  },
  userSettings: {
    get: (key: string) => {
      return ipcRenderer.invoke("user-settings-get", key);
    },
    set: (key: string, value: any) => {
      return ipcRenderer.invoke("user-settings-set", key, value);
    },
  },
  path: {
    join: (...paths: string[]) => {
      return ipcRenderer.invoke("path-join", ...paths);
    },
  },
  db: {
    connect: () => ipcRenderer.invoke("db-connect"),
    disconnect: () => ipcRenderer.invoke("db-disconnect"),
    onTransaction: (
      callback: (
        event: IpcRendererEvent,
        state: {
          model: string;
          id: string;
          action: "create" | "update" | "destroy";
        }
      ) => void
    ) => ipcRenderer.on("db-on-transaction", callback),
    removeListeners: () => {
      ipcRenderer.removeAllListeners("db-on-transaction");
    },
  },
  camdict: {
    lookup: (word: string) => {
      return ipcRenderer.invoke("camdict-lookup", word);
    },
  },
  mdict: {
    remove: (dict: Dict) => ipcRenderer.invoke("mdict-remove", dict),
    getResource: (key: string, dict: Dict) =>
      ipcRenderer.invoke("mdict-read-file", key, dict),
    lookup: (word: string, dict: Dict) =>
      ipcRenderer.invoke("mdict-lookup", word, dict),
    import: (pathes: string[]) => ipcRenderer.invoke("mdict-import", pathes),
  },
  dict: {
    getDicts: () => ipcRenderer.invoke("dict-list"),
    remove: (dict: Dict) => ipcRenderer.invoke("dict-remove", dict),
    getResource: (key: string, dict: Dict) =>
      ipcRenderer.invoke("dict-read-file", key, dict),
    lookup: (word: string, dict: Dict) =>
      ipcRenderer.invoke("dict-lookup", word, dict),
    import: (path: string) => ipcRenderer.invoke("dict-import", path),
  },
  audios: {
    findAll: (params: {
      offset: number | undefined;
      limit: number | undefined;
    }) => {
      return ipcRenderer.invoke("audios-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("audios-find-one", params);
    },
    create: (uri: string, params?: any) => {
      return ipcRenderer.invoke("audios-create", uri, params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("audios-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("audios-destroy", id);
    },
    upload: (id: string) => {
      return ipcRenderer.invoke("audios-upload", id);
    },
    crop: (id: string, params: { startTime: number; endTime: number }) => {
      return ipcRenderer.invoke("audios-crop", id, params);
    },
    cleanUp: () => {
      return ipcRenderer.invoke("audios-clean-up");
    },
  },
  videos: {
    findAll: (params: {
      offset: number | undefined;
      limit: number | undefined;
    }) => {
      return ipcRenderer.invoke("videos-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("videos-find-one", params);
    },
    create: (uri: string, params?: any) => {
      return ipcRenderer.invoke("videos-create", uri, params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("videos-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("videos-destroy", id);
    },
    upload: (id: string) => {
      return ipcRenderer.invoke("videos-upload", id);
    },
    crop: (id: string, params: { startTime: number; endTime: number }) => {
      return ipcRenderer.invoke("videos-crop", id, params);
    },
    cleanUp: () => {
      return ipcRenderer.invoke("videos-clean-up");
    },
  },
  recordings: {
    findAll: (params?: {
      targetId?: string;
      targetType?: string;
      offset?: number;
      limit?: number;
    }) => {
      return ipcRenderer.invoke("recordings-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("recordings-find-one", params);
    },
    sync: (id: string) => {
      return ipcRenderer.invoke("recordings-sync", id);
    },
    syncAll: () => {
      return ipcRenderer.invoke("recordings-sync-all");
    },
    create: (params: any) => {
      return ipcRenderer.invoke("recordings-create", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("recordings-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("recordings-destroy", id);
    },
    destroyBulk: (where: any, options?: any) => {
      return ipcRenderer.invoke("recordings-destroy-bulk", where, options);
    },
    upload: (id: string) => {
      return ipcRenderer.invoke("recordings-upload", id);
    },
    stats: (params: { from: string; to: string }) => {
      return ipcRenderer.invoke("recordings-stats", params);
    },
    groupByDate: (params: { from: string; to: string }) => {
      return ipcRenderer.invoke("recordings-group-by-date", params);
    },
    groupByTarget: (params: { from: string; to: string }) => {
      return ipcRenderer.invoke("recordings-group-by-target", params);
    },
    groupBySegment: (targetId: string, targetType: string) => {
      return ipcRenderer.invoke(
        "recordings-group-by-segment",
        targetId,
        targetType
      );
    },
    statsForDeleteBulk: () => {
      return ipcRenderer.invoke("recordings-stats-for-delete-bulk");
    },
    export: (targetId: string, targetType: string) => {
      return ipcRenderer.invoke("recordings-export", targetId, targetType);
    },
  },
  conversations: {
    findAll: (params: { where?: any; offset?: number; limit?: number }) => {
      return ipcRenderer.invoke("conversations-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("conversations-find-one", params);
    },
    create: (params: any) => {
      return ipcRenderer.invoke("conversations-create", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("conversations-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("conversations-destroy", id);
    },
    migrate: (id: string) => {
      return ipcRenderer.invoke("conversations-migrate", id);
    },
  },
  pronunciationAssessments: {
    findAll: (params: { where?: any; offset?: number; limit?: number }) => {
      return ipcRenderer.invoke("pronunciation-assessments-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("pronunciation-assessments-find-one", params);
    },
    create: (params: any) => {
      return ipcRenderer.invoke("pronunciation-assessments-create", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("pronunciation-assessments-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("pronunciation-assessments-destroy", id);
    },
  },
  messages: {
    findAll: (params: { where?: any; offset?: number; limit?: number }) => {
      return ipcRenderer.invoke("messages-find-all", params);
    },
    findOne: (where: any) => {
      return ipcRenderer.invoke("messages-find-one", where);
    },
    createInBatch: (messages: Partial<MessageType>[]) => {
      return ipcRenderer.invoke("messages-create-in-batch", messages);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("messages-destroy", id);
    },
    createSpeech: (id: string, configuration?: { [key: string]: any }) => {
      return ipcRenderer.invoke("messages-create-speech", id, configuration);
    },
  },
  speeches: {
    findOne: (where: any) => {
      return ipcRenderer.invoke("speeches-find-one", where);
    },
    create: (
      params: {
        sourceId: string;
        sourceType: string;
        text: string;
        configuration: {
          engine: string;
          model: string;
          voice: string;
        };
      },
      blob: { type: string; arrayBuffer: ArrayBuffer }
    ) => {
      return ipcRenderer.invoke("speeches-create", params, blob);
    },
    delete: (id: string) => {
      return ipcRenderer.invoke("speeches-delete", id);
    },
  },
  audiowaveform: {
    generate: (
      file: string,
      options?: {
        force: boolean;
        extra: string[];
      }
    ) => {
      return ipcRenderer.invoke("audiowaveform-generate", file, options);
    },
    frequencies: (file: string) => {
      return ipcRenderer.invoke("audiowaveform-frequencies", file);
    },
  },
  echogarden: {
    getPackagesDir: () => {
      return ipcRenderer.invoke("echogarden-get-packages-dir");
    },
    recognize: (input: string, options: RecognitionOptions) => {
      return ipcRenderer.invoke("echogarden-recognize", input, options);
    },
    align: (input: string, transcript: string, options: any) => {
      return ipcRenderer.invoke("echogarden-align", input, transcript, options);
    },
    alignSegments: (input: string, timeline: Timeline, options: any) => {
      return ipcRenderer.invoke(
        "echogarden-align-segments",
        input,
        timeline,
        options
      );
    },
    wordToSentenceTimeline: (
      wordTimeline: Timeline,
      transcript: string,
      language: string
    ) => {
      return ipcRenderer.invoke(
        "echogarden-word-to-sentence-timeline",
        wordTimeline,
        transcript,
        language
      );
    },
    transcode: (input: string) => {
      return ipcRenderer.invoke("echogarden-transcode", input);
    },
    check: (options: RecognitionOptions) => {
      return ipcRenderer.invoke("echogarden-check", options);
    },
    checkAlign: (options: AlignmentOptions) => {
      return ipcRenderer.invoke("echogarden-check-align", options);
    },
  },
  ffmpeg: {
    check: () => {
      return ipcRenderer.invoke("ffmpeg-check-command");
    },
    transcode: (input: string, output: string, options: string[]) => {
      return ipcRenderer.invoke("ffmpeg-transcode", input, output, options);
    },
  },
  decompress: {
    onComplete: (
      callback: (event: IpcRendererEvent, task: DecompressTask) => void
    ) => ipcRenderer.on("decompress-task-done", callback),
    onUpdate: (
      callback: (event: IpcRendererEvent, tasks: DecompressTask[]) => void
    ) => ipcRenderer.on("decompress-tasks-update", callback),
    dashboard: () => ipcRenderer.invoke("decompress-tasks"),
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners("decompress-tasks-update");
      ipcRenderer.removeAllListeners("decompress-tasks-done");
    },
  },
  download: {
    onState: (
      callback: (event: IpcRendererEvent, state: DownloadStateType) => void
    ) => ipcRenderer.on("download-on-state", callback),
    start: (url: string, savePath?: string) =>
      ipcRenderer.invoke("download-start", url, savePath),
    printAsPdf: (content: string, savePath: string) =>
      ipcRenderer.invoke("print-as-pdf", content, savePath),
    cancel: (filename: string) =>
      ipcRenderer.invoke("download-cancel", filename),
    pause: (filename: string) => ipcRenderer.invoke("download-pause", filename),
    remove: (filename: string) =>
      ipcRenderer.invoke("download-remove", filename),
    resume: (filename: string) =>
      ipcRenderer.invoke("download-resume", filename),
    cancelAll: () => ipcRenderer.invoke("download-cancel-all"),
    dashboard: () => ipcRenderer.invoke("download-dashboard"),
    removeAllListeners: () =>
      ipcRenderer.removeAllListeners("download-on-error"),
  },
  cacheObjects: {
    get: (key: string) => {
      return ipcRenderer.invoke("cache-objects-get", key);
    },
    set: (key: string, value: string | any, ttl?: number) => {
      return ipcRenderer.invoke("cache-objects-set", key, value, ttl);
    },
    delete: (key: string) => {
      return ipcRenderer.invoke("cache-objects-delete", key);
    },
    clear: () => {
      return ipcRenderer.invoke("cache-objects-clear");
    },
    writeFile: (filename: string, data: ArrayBuffer) => {
      return ipcRenderer.invoke("cache-objects-write-file", filename, data);
    },
  },
  transcriptions: {
    findOrCreate: (params: any) => {
      return ipcRenderer.invoke("transcriptions-find-or-create", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("transcriptions-update", id, params);
    },
  },
  waveforms: {
    find: (id: string) => {
      return ipcRenderer.invoke("waveforms-find", id);
    },
    save: (id: string, data: WaveFormDataType) => {
      return ipcRenderer.invoke("waveforms-save", id, data);
    },
  },
  segments: {
    findAll: (params: {
      targetId?: string;
      targetType?: string;
      offset?: number;
      limit?: number;
    }) => {
      return ipcRenderer.invoke("segments-find-all", params);
    },
    find: (id: string) => {
      return ipcRenderer.invoke("segments-find", id);
    },
    create: (params: any) => {
      return ipcRenderer.invoke("segments-create", params);
    },
    sync: (id: string) => {
      return ipcRenderer.invoke("segments-sync", id);
    },
  },
  notes: {
    groupByTarget: (params?: { limit?: number; offset?: number }) => {
      return ipcRenderer.invoke("notes-group-by-target", params);
    },
    groupBySegment: (targetId: string, targetType: string) => {
      return ipcRenderer.invoke("notes-group-by-segment", targetId, targetType);
    },
    findAll: (params: {
      targetId?: string;
      targetType?: string;
      offset?: number;
      limit?: number;
    }) => {
      return ipcRenderer.invoke("notes-find-all", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("notes-update", id, params);
    },
    delete: (id: string) => {
      return ipcRenderer.invoke("notes-delete", id);
    },
    create: (params: any) => {
      return ipcRenderer.invoke("notes-create", params);
    },
    sync: (id: string) => {
      return ipcRenderer.invoke("notes-sync", id);
    },
  },
  chats: {
    findAll: (params: { query?: string; offset?: number; limit?: number }) => {
      return ipcRenderer.invoke("chats-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("chats-find-one", params);
    },
    create: (params: any) => {
      return ipcRenderer.invoke("chats-create", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("chats-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("chats-destroy", id);
    },
  },
  chatAgents: {
    findAll: (params: { query?: string; offset?: number; limit?: number }) => {
      return ipcRenderer.invoke("chat-agents-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("chat-agents-find-one", params);
    },
    create: (params: any) => {
      return ipcRenderer.invoke("chat-agents-create", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("chat-agents-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("chat-agents-destroy", id);
    },
  },
  chatMembers: {
    findAll: (params: any) => {
      return ipcRenderer.invoke("chat-members-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("chat-members-find-one", params);
    },
    create: (params: any) => {
      return ipcRenderer.invoke("chat-members-create", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("chat-members-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("chat-members-destroy", id);
    },
  },
  chatMessages: {
    findAll: (params: {
      chatSessionId: string;
      offset?: number;
      limit?: number;
    }) => {
      return ipcRenderer.invoke("chat-messages-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("chat-messages-find-one", params);
    },
    create: (params: any) => {
      return ipcRenderer.invoke("chat-messages-create", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("chat-messages-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("chat-messages-destroy", id);
    },
  },
  documents: {
    findAll: (params: any) => {
      return ipcRenderer.invoke("documents-find-all", params);
    },
    findOne: (params: any) => {
      return ipcRenderer.invoke("documents-find-one", params);
    },
    create: (params: any) => {
      return ipcRenderer.invoke("documents-create", params);
    },
    update: (id: string, params: any) => {
      return ipcRenderer.invoke("documents-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("documents-destroy", id);
    },
    upload: (id: string) => {
      return ipcRenderer.invoke("documents-upload", id);
    },
    cleanUp: () => {
      return ipcRenderer.invoke("documents-clean-up");
    },
  },
});
