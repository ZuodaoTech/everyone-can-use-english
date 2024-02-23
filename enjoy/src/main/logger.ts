import log from "electron-log/main";
import path from "path";
import settings from "@main/settings";

log.initialize({ preload: true });

log.transports.file.level = "info";
log.transports.file.resolvePathFn = () =>
  path.join(settings.libraryPath(), "logs", "main.log");
log.errorHandler.startCatching();

export default log;
