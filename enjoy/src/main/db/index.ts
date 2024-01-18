import { ipcMain } from "electron";
import settings from "@main/settings";
import { Sequelize } from "sequelize-typescript";
import { Umzug, SequelizeStorage } from "umzug";
import {
  Audio,
  Recording,
  CacheObject,
  Conversation,
  Message,
  PronunciationAssessment,
  Speech,
  Transcription,
  Video,
} from "./models";
import {
  audiosHandler,
  cacheObjectsHandler,
  conversationsHandler,
  messagesHandler,
  recordingsHandler,
  transcriptionsHandler,
  videosHandler,
} from "./handlers";

const db = {
  connection: null as Sequelize | null,
  connect: async () => {},
  registerIpcHandlers: () => {},
};

db.connect = async () => {
  if (db.connection) {
    return;
  }
  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: settings.dbPath(),
    models: [
      Audio,
      CacheObject,
      Conversation,
      Message,
      PronunciationAssessment,
      Recording,
      Speech,
      Transcription,
      Video,
    ],
  });

  db.connection = sequelize;

  const umzug = new Umzug({
    migrations: { glob: __dirname + "/migrations/*.js" },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });

  // migrate up to the latest state
  await umzug.up();

  await sequelize.query("PRAGMA foreign_keys = false;");
  await sequelize.sync();
  await sequelize.authenticate();

  // kill the zombie transcribe processes
  Transcription.findAll({
    where: {
      state: "processing",
    },
  }).then((transcriptions) => {
    transcriptions.forEach((transcription) => {
      if (transcription.result) {
        transcription.update({ state: "finished" });
      } else {
        transcription.update({ state: "pending" });
      }
    });
  });

  // vacuum the database
  await sequelize.query("VACUUM");

  // register handlers
  audiosHandler.register();
  cacheObjectsHandler.register();
  recordingsHandler.register();
  conversationsHandler.register();
  messagesHandler.register();
  transcriptionsHandler.register();
  videosHandler.register();
};

db.registerIpcHandlers = () => {
  ipcMain.handle("db-init", async () => {
    return db
      .connect()
      .then(() => {
        return {
          state: "connected",
        };
      })
      .catch((err) => {
        return {
          state: "error",
          error: err.message,
        };
      });
  });
};

export default db;
