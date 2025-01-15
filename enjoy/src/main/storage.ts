import { STORAGE_WORKER_ENDPOINT } from "@/constants";
import axios, { AxiosInstance } from "axios";
import fs from "fs-extra";
import log from "@main/logger";
const logger = log.scope("STORAGE");

const ONE_MINUTE = 1000 * 60; // 1 minute
class Storage {
  public api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: STORAGE_WORKER_ENDPOINT,
      timeout: ONE_MINUTE * 15,
    });
    this.api.interceptors.request.use((config) => {
      logger.debug(
        `${config.method?.toUpperCase()} ${config.baseURL} ${config.url}`
      );
      return config;
    });
  }

  getUrl(key: string) {
    return `${STORAGE_WORKER_ENDPOINT}/${key}`;
  }

  get(key: string) {
    return this.api.get(`/${key}`);
  }

  put(key: string, filePath: string, contentType?: string) {
    const data = fs.readFileSync(filePath);
    const form = new FormData();
    form.append("file", new Blob([data], { type: contentType }), key);
    return this.api.postForm(`/${key}`, form);
  }
}

export default new Storage();
