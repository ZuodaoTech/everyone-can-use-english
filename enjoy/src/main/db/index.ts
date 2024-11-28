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
  Document,
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
  documentsHandler,
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
import { i18n } from "@main/i18n";
import { UserSettingKeyEnum } from "@/types/enums";
import log from "@main/logger";
import fs from "fs-extra";

const __dirname = import.meta.dirname;
const logger = log.scope("DB");

const db = {
  connection: null as Sequelize | null,
  connect: async () => {},
  disconnect: async () => {},
  registerIpcHandlers: () => {},
  isConnecting: false,
  backup: async (options?: { force: boolean }) => {},
  restore: async (backupFilePath: string) => {},
};

const handlers = [
  audiosHandler,
  cacheObjectsHandler,
  chatAgentsHandler,
  chatMembersHandler,
  chatMessagesHandler,
  chatsHandler,
  conversationsHandler,
  documentsHandler,
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
        Document,
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

    const pendingMigrations = await umzug.pending();
    logger.info(pendingMigrations);
    if (pendingMigrations.length > 0) {
      try {
        await db.backup({ force: true });
      } catch (err) {
        logger.error(err);
      }
      try {
        // migrate up to the latest state
        await umzug.up();
      } catch (err) {
        logger.error(err);
        await sequelize.close();
        throw err;
      }

      const pendingMigrationTimestamp = pendingMigrations[0].name.split("-")[0];
      if (parseInt(pendingMigrationTimestamp) <= 1725411577564) {
        // migrate settings
        logger.info("Migrating settings");
        await UserSetting.migrateFromSettings();
      }

      if (parseInt(pendingMigrationTimestamp) <= 1726781106038) {
        // migrate chat agents
        logger.info("Migrating chat agents");
        await ChatAgent.migrateConfigToChatMember();
      }
    } else {
      await db.backup();
    }

    await sequelize.query("PRAGMA foreign_keys = false;");
    await sequelize.sync();
    await sequelize.authenticate();

    // vacuum the database
    logger.info("Vacuuming the database");
    await sequelize.query("VACUUM");

    // initialize i18n
    const language = (await UserSetting.get(
      UserSettingKeyEnum.LANGUAGE
    )) as string;
    i18n(language);

    // register handlers
    logger.info(`Registering handlers`);
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

db.backup = async (options?: { force: boolean }) => {
  const force = options?.force ?? false;

  const dbPath = settings.dbPath();
  if (!dbPath) {
    logger.error("Db path is not ready");
    return;
  }

  const backupPath = path.join(settings.userDataPath(), "backup");
  fs.ensureDirSync(backupPath);

  const backupFiles = fs
    .readdirSync(backupPath)
    .filter((file) => file.startsWith(path.basename(dbPath)))
    .sort();

  // Check if the last backup is older than 1 day
  const lastBackup = backupFiles.pop();
  const timestamp = lastBackup?.match(/\d{13}/)?.[0];
  if (
    !force &&
    lastBackup &&
    timestamp &&
    new Date(parseInt(timestamp)) > new Date(Date.now() - 1000 * 60 * 60 * 24)
  ) {
    logger.info(`Backup is up to date: ${lastBackup}`);
    return;
  }

  // Only keep the latest 10 backups
  if (backupFiles.length >= 10) {
    fs.removeSync(path.join(backupPath, backupFiles[0]));
  }

  const backupFilePath = path.join(
    backupPath,
    `${path.basename(dbPath)}.${Date.now().toString().padStart(13, "0")}`
  );
  fs.copySync(dbPath, backupFilePath);

  logger.info(`Backup created at ${backupFilePath}`);
};

db.restore = async (backupFilePath: string) => {
  const dbPath = settings.dbPath();
  if (!dbPath) {
    logger.error("Db path is not ready");
    return;
  }

  if (!fs.existsSync(backupFilePath)) {
    logger.error(`Backup file not found at ${backupFilePath}`);
    return;
  }

  try {
    await db.disconnect();

    fs.copySync(backupFilePath, dbPath);
    logger.info(`Database restored from ${backupFilePath}`);
  } catch (err) {
    logger.error(err);
    throw err;
  } finally {
    db.connect();
  }
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

  ipcMain.handle("db-backup", async () => {
    db.backup();
  });

  ipcMain.handle("db-restore", async (_, backupFilePath: string) => {
    db.restore(backupFilePath);
  });
};

export default db;
