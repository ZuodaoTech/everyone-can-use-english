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
  Note,
  PronunciationAssessment,
  Segment,
  Speech,
  Transcription,
  Video,
} from "./models";
import {
  audiosHandler,
  cacheObjectsHandler,
  conversationsHandler,
  messagesHandler,
  notesHandler,
  recordingsHandler,
  segmentsHandler,
  speechesHandler,
  transcriptionsHandler,
  videosHandler,
} from "./handlers";
import path from "path";
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      Note,
      PronunciationAssessment,
      Recording,
      Segment,
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
  conversationsHandler.register();
  messagesHandler.register();
  notesHandler.register();
  recordingsHandler.register();
  segmentsHandler.register();
  speechesHandler.register();
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
