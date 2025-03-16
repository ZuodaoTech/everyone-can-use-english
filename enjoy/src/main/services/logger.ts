import log from "electron-log/main";

log.initialize({ preload: true });

log.transports.file.level = "info";
log.errorHandler.startCatching();

export default log;
