import { ipcMain } from "electron";
import settings from "@main/settings";
import { Sequelize } from "sequelize-typescript";
import { Umzug, SequelizeStorage, Resolver, RunnableMigration } from "umzug";
import {
  Audio,
  Recording,
  CacheObject,
  Chat,
  ChatAgent,
  ChatMember,
  ChatMessage,
  Conversation,
  Message,
  Note,
  PronunciationAssessment,
  Segment,
  Speech,
  Transcription,
  Video,
  UserSetting,
} from "./models";
import {
  audiosHandler,
  cacheObjectsHandler,
  chatAgentsHandler,
  chatMembersHandler,
  chatMessagesHandler,
  chatsHandler,
  conversationsHandler,
  messagesHandler,
  notesHandler,
  pronunciationAssessmentsHandler,
  recordingsHandler,
  segmentsHandler,
  speechesHandler,
  transcriptionsHandler,
  videosHandler,
  userSettingsHandler,
} from "./handlers";
import os from "os";
import path from "path";
import url from "url";
import { i18n } from "@main/i18n";
import { UserSettingKeyEnum } from "@/types/enums";
import log from "@main/logger";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = log.scope("DB");

const db = {
  connection: null as Sequelize | null,
  connect: async () => {},
  disconnect: async () => {},
  registerIpcHandlers: () => {},
  isConnecting: false,
};

const handlers = [
  audiosHandler,
  cacheObjectsHandler,
  chatAgentsHandler,
  chatMembersHandler,
  chatMessagesHandler,
  chatsHandler,
  conversationsHandler,
  messagesHandler,
  notesHandler,
  pronunciationAssessmentsHandler,
  recordingsHandler,
  segmentsHandler,
  speechesHandler,
  transcriptionsHandler,
  userSettingsHandler,
  videosHandler,
];

db.connect = async () => {
  // Use a lock to prevent concurrent connections
  if (db.isConnecting) {
    throw new Error("Database connection is already in progress");
  }

  db.isConnecting = true;

  try {
    if (db.connection) {
      return;
    }
    const dbPath = settings.dbPath();
    if (!dbPath) {
      throw new Error("Db path is not ready");
    }

    const sequelize = new Sequelize({
      dialect: "sqlite",
      storage: dbPath,
      models: [
        Audio,
        CacheObject,
        Chat,
        ChatAgent,
        ChatMember,
        ChatMessage,
        Conversation,
        Message,
        Note,
        PronunciationAssessment,
        Recording,
        Segment,
        Speech,
        Transcription,
        UserSetting,
        Video,
      ],
    });

    const migrationResolver: Resolver<unknown> = ({
      name,
      path: filepath,
      context,
    }) => {
      if (!filepath) {
        throw new Error(
          `Can't use default resolver for non-filesystem migrations`
        );
      }

      const loadModule: () => Promise<
        RunnableMigration<unknown>
      > = async () => {
        if (os.platform() === "win32") {
          return import(`file://${filepath}`) as Promise<
            RunnableMigration<unknown>
          >;
        } else {
          return import(filepath) as Promise<RunnableMigration<unknown>>;
        }
      };

      const getModule = async () => {
        return await loadModule();
      };

      return {
        name,
        path: filepath,
        up: async () =>
          (await getModule()).up({ path: filepath, name, context }),
        down: async () =>
          (await getModule()).down?.({ path: filepath, name, context }),
      };
    };

    const umzug = new Umzug({
      migrations: {
        glob: ["migrations/*.js", { cwd: __dirname }],
        resolve: migrationResolver,
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: logger,
    });

    try {
      // migrate up to the latest state
      await umzug.up();

      await sequelize.query("PRAGMA foreign_keys = false;");
      await sequelize.sync();
      await sequelize.authenticate();
    } catch (err) {
      logger.error(err);
      await sequelize.close();
      throw err;
    }

    // migrate settings
    await UserSetting.migrateFromSettings();

    // initialize i18n
    const language = (await UserSetting.get(
      UserSettingKeyEnum.LANGUAGE
    )) as string;
    i18n(language);

    // vacuum the database
    await sequelize.query("VACUUM");

    // register handlers

    for (const handler of handlers) {
      handler.register();
    }

    db.connection = sequelize;
    logger.info("Database connection established");
  } catch (err) {
    logger.error(err);
    throw err;
  } finally {
    db.isConnecting = false;
  }
};

db.disconnect = async () => {
  // unregister handlers
  for (const handler of handlers) {
    handler.unregister();
  }

  await db.connection?.close();
  db.connection = null;
};

db.registerIpcHandlers = () => {
  ipcMain.handle("db-connect", async () => {
    if (db.isConnecting)
      return {
        state: "connecting",
        path: settings.dbPath(),
        error: null,
      };

    try {
      await db.connect();
      return {
        state: "connected",
        path: settings.dbPath(),
        error: null,
      };
    } catch (err) {
      return {
        state: "error",
        error: err.message,
        path: settings.dbPath(),
      };
    }
  });

  ipcMain.handle("db-disconnect", async () => {
    db.disconnect();
  });
};

export default db;
