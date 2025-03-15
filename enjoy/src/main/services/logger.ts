import log from "electron-log/main";
import path from "path";
import { config } from "@main/config";

log.initialize({ preload: true });

log.transports.file.level = "info";
log.transports.file.resolvePathFn = () =>
  path.join(config.libraryPath(), "logs", "main.log");
log.errorHandler.startCatching();

export default log;
