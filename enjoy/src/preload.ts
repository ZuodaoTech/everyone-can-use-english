// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { version } from "../package.json";

contextBridge.exposeInMainWorld("__ENJOY_APP__", {
  app: {
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
    quit: () => {
      ipcRenderer.invoke("app-quit");
    },
    openDevTools: () => {
      ipcRenderer.invoke("app-open-dev-tools");
    },
    createIssue: (title: string, body: string) => {
      return ipcRenderer.invoke("app-create-issue", title, body);
    },
    version,
  },
  system: {
    preferences: {
      mediaAccess: (mediaType: "microphone" | "camera") => {
        return ipcRenderer.invoke("system-preferences-media-access", mediaType);
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
  settings: {
    getLibrary: () => {
      return ipcRenderer.invoke("settings-get-library");
    },
    setLibrary: (library: string) => {
      return ipcRenderer.invoke("settings-set-library", library);
    },
    getUser: () => {
      return ipcRenderer.invoke("settings-get-user");
    },
    setUser: (user: UserType) => {
      return ipcRenderer.invoke("settings-set-user", user);
    },
    getUserDataPath: () => {
      return ipcRenderer.invoke("settings-get-user-data-path");
    },
    getLlm: (provider: string) => {
      return ipcRenderer.invoke("settings-get-llm", provider);
    },
    setLlm: (provider: string, config: LlmProviderType) => {
      return ipcRenderer.invoke("settings-set-llm", provider, config);
    },
    getLanguage: (language: string) => {
      return ipcRenderer.invoke("settings-get-language", language);
    },
    switchLanguage: (language: string) => {
      return ipcRenderer.invoke("settings-switch-language", language);
    },
  },
  path: {
    join: (...paths: string[]) => {
      return ipcRenderer.invoke("path-join", ...paths);
    },
  },
  db: {
    init: () => ipcRenderer.invoke("db-init"),
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
  audios: {
    findAll: (params: {
      offset: number | undefined;
      limit: number | undefined;
    }) => {
      return ipcRenderer.invoke("audios-find-all", params);
    },
    findOne: (params: object) => {
      return ipcRenderer.invoke("audios-find-one", params);
    },
    create: (uri: string, params?: object) => {
      return ipcRenderer.invoke("audios-create", uri, params);
    },
    update: (id: string, params: object) => {
      return ipcRenderer.invoke("audios-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("audios-destroy", id);
    },
    transcribe: (id: string) => {
      return ipcRenderer.invoke("audios-transcribe", id);
    },
    upload: (id: string) => {
      return ipcRenderer.invoke("audios-upload", id);
    },
  },
  videos: {
    findAll: (params: {
      offset: number | undefined;
      limit: number | undefined;
    }) => {
      return ipcRenderer.invoke("videos-find-all", params);
    },
    findOne: (params: object) => {
      return ipcRenderer.invoke("videos-find-one", params);
    },
    create: (uri: string, params?: object) => {
      return ipcRenderer.invoke("videos-create", uri, params);
    },
    update: (id: string, params: object) => {
      return ipcRenderer.invoke("videos-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("videos-destroy", id);
    },
    transcribe: (id: string) => {
      return ipcRenderer.invoke("videos-transcribe", id);
    },
    upload: (id: string) => {
      return ipcRenderer.invoke("videos-upload", id);
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
    findOne: (params: object) => {
      return ipcRenderer.invoke("recordings-find-one", params);
    },
    create: (params: object) => {
      return ipcRenderer.invoke("recordings-create", params);
    },
    update: (id: string, params: object) => {
      return ipcRenderer.invoke("recordings-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("recordings-destroy", id);
    },
    upload: (id: string) => {
      return ipcRenderer.invoke("recordings-upload", id);
    },
    assess: (id: string) => {
      return ipcRenderer.invoke("recordings-assess", id);
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
  },
  conversations: {
    findAll: (params: { where?: object; offset?: number; limit?: number }) => {
      return ipcRenderer.invoke("conversations-find-all", params);
    },
    findOne: (params: object) => {
      return ipcRenderer.invoke("conversations-find-one", params);
    },
    create: (params: object) => {
      return ipcRenderer.invoke("conversations-create", params);
    },
    update: (id: string, params: object) => {
      return ipcRenderer.invoke("conversations-update", id, params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("conversations-destroy", id);
    },
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
    ) => {
      return ipcRenderer.invoke("conversations-ask", id, params);
    },
  },
  messages: {
    findAll: (params: { where?: object; offset?: number; limit?: number }) => {
      return ipcRenderer.invoke("messages-find-all", params);
    },
    findOne: (params: object) => {
      return ipcRenderer.invoke("messages-find-one", params);
    },
    destroy: (id: string) => {
      return ipcRenderer.invoke("messages-destroy", id);
    },
    createSpeech: (id: string, configuration?: { [key: string]: any }) => {
      return ipcRenderer.invoke("messages-create-speech", id, configuration);
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
  whisper: {
    config: () => {
      return ipcRenderer.invoke("whisper-config");
    },
    setModel: (model: string) => {
      return ipcRenderer.invoke("whisper-set-model", model);
    },
    setService: (service: string) => {
      return ipcRenderer.invoke("whisper-set-service", service);
    },
    check: () => {
      return ipcRenderer.invoke("whisper-check");
    },
    transcribeBlob: (
      blob: { type: string; arrayBuffer: ArrayBuffer },
      prompt?: string
    ) => {
      return ipcRenderer.invoke("whisper-transcribe-blob", blob, prompt);
    },
  },
  ffmpeg: {
    config: () => {
      return ipcRenderer.invoke("ffmpeg-config");
    },
    setConfig: (config: FfmpegConfigType) => {
      return ipcRenderer.invoke("ffmpeg-set-config", config);
    },
    download: () => {
      return ipcRenderer.invoke("ffmpeg-download");
    },
    discover: () => {
      return ipcRenderer.invoke("ffmpeg-discover-command");
    },
    check: () => {
      return ipcRenderer.invoke("ffmpeg-check-command");
    },
  },
  download: {
    onState: (
      callback: (event: IpcRendererEvent, state: DownloadStateType) => void
    ) => ipcRenderer.on("download-on-state", callback),
    start: (url: string, savePath?: string) => {
      ipcRenderer.invoke("download-start", url, savePath);
    },
    cancel: (filename: string) => {
      ipcRenderer.invoke("download-cancel", filename);
    },
    cancelAll: () => {
      ipcRenderer.invoke("download-cancel-all");
    },
    dashboard: () => {
      return ipcRenderer.invoke("download-dashboard");
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners("download-on-error");
    },
  },
  cacheObjects: {
    get: (key: string) => {
      return ipcRenderer.invoke("cache-objects-get", key);
    },
    set: (key: string, value: string | object, ttl?: number) => {
      return ipcRenderer.invoke("cache-objects-set", key, value, ttl);
    },
    delete: (key: string) => {
      return ipcRenderer.invoke("cache-objects-delete", key);
    },
    clear: () => {
      return ipcRenderer.invoke("cache-objects-clear");
    },
  },
  transcriptions: {
    findOrCreate: (params: any) => {
      return ipcRenderer.invoke("transcriptions-find-or-create", params);
    },
    process: (params: any, options: any) => {
      return ipcRenderer.invoke("transcriptions-process", params, options);
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
});
