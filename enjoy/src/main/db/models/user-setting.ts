import {
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  DataType,
  AllowNull,
} from "sequelize-typescript";
import { Op } from "sequelize";
import log from "@/main/services/logger";
import { config } from "@main/config";
import * as i18n from "i18next";
import { SttEngineOptionEnum, UserSettingKeyEnum } from "@/shared/types/enums";

const logger = log.scope("db/userSetting");

@Table({
  modelName: "UserSetting",
  tableName: "user_settings",
  underscored: true,
  timestamps: true,
})
export class UserSetting extends Model<UserSetting> {
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.STRING)
  key: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  value: string;

  static async get(key: UserSettingKeyEnum | string): Promise<any> {
    logger.debug(`UserSetting.get: Getting value for key "${key}"`);
    const setting = await UserSetting.findOne({ where: { key } });
    logger.debug(
      `UserSetting.get: Retrieved setting for key "${key}":`,
      setting?.toJSON ? setting.toJSON() : setting
    );

    if (!setting) {
      logger.debug(`UserSetting.get: No setting found for key "${key}"`);
      return null;
    }

    try {
      const parsedValue = JSON.parse(setting.value);
      logger.debug(
        `UserSetting.get: Parsed JSON value for key "${key}":`,
        parsedValue
      );
      return parsedValue;
    } catch {
      logger.debug(
        `UserSetting.get: Returning raw value for key "${key}":`,
        setting.value
      );
      return setting.value;
    }
  }

  static async set(
    key: UserSettingKeyEnum | string,
    value: any
  ): Promise<void> {
    const setting = await UserSetting.findOne({ where: { key } });

    if (typeof value === "object") {
      value = JSON.stringify(value);
    }

    if (setting) {
      await setting.update({ value });
    } else {
      await UserSetting.create({ key, value });
    }

    // update i18n
    if (key === UserSettingKeyEnum.LANGUAGE) {
      try {
        await i18n.changeLanguage(value);
      } catch (error) {
        logger.error("UserSetting.set: changeLanguage failed", error);
      }
    }
  }

  static async accessToken(): Promise<string | null> {
    return (await UserSetting.get(UserSettingKeyEnum.PROFILE))?.accessToken;
  }

  static async clear(): Promise<void> {
    await UserSetting.destroy({ where: {} });
  }

  /**
   * Get all plugin settings
   */
  static async getPluginSettings(
    pluginId?: string
  ): Promise<Record<string, any>> {
    let whereCondition: any = {};

    if (pluginId) {
      whereCondition = {
        key: {
          [Op.startsWith]: `plugin.${pluginId}.`,
        },
      };
    } else {
      whereCondition = {
        key: {
          [Op.startsWith]: "plugin.",
        },
      };
    }

    const settings = await UserSetting.findAll({ where: whereCondition });
    const result: Record<string, any> = {};

    for (const setting of settings) {
      // Extract plugin ID and key from the setting key
      // Format: plugin.<pluginId>.<key>
      const parts = setting.key.split(".");
      if (parts.length < 3) continue;

      const id = parts[1];
      const key = parts.slice(2).join(".");

      // Initialize plugin object if it doesn't exist
      if (!result[id]) {
        result[id] = {};
      }

      // Parse value if it's JSON
      try {
        result[id][key] = JSON.parse(setting.value);
      } catch {
        result[id][key] = setting.value;
      }
    }

    return result;
  }

  static async migrateFromSettings(): Promise<void> {
    // hotkeys
    const hotkeys = await UserSetting.get(UserSettingKeyEnum.HOTKEYS);
    const prevHotkeys = config.getAppSetting("defaultHotkeys" as any).value;
    if (prevHotkeys && !hotkeys) {
      UserSetting.set(UserSettingKeyEnum.HOTKEYS, prevHotkeys as object);
    }

    // GPT Engine
    const gptEngine = await UserSetting.get(UserSettingKeyEnum.GPT_ENGINE);
    const prevGptEngine = config.getAppSetting("engine.gpt" as any).value;
    if (prevGptEngine && !gptEngine) {
      UserSetting.set(UserSettingKeyEnum.GPT_ENGINE, prevGptEngine as object);
    }

    // OpenAI API Key
    const openai = await UserSetting.get(UserSettingKeyEnum.OPENAI);
    const prevOpenai = config.getAppSetting("openai" as any).value;
    if (prevOpenai && !openai) {
      UserSetting.set(UserSettingKeyEnum.OPENAI, prevOpenai as object);
    }

    // Language
    const language = await UserSetting.get(UserSettingKeyEnum.LANGUAGE);
    const prevLanguage = config.getAppSetting("language" as any).value;
    if (prevLanguage && !language) {
      UserSetting.set(UserSettingKeyEnum.LANGUAGE, prevLanguage as string);
    }

    // Native Language
    const nativeLanguage = await UserSetting.get(
      UserSettingKeyEnum.NATIVE_LANGUAGE
    );
    const prevNativeLanguage = config.getAppSetting(
      "nativeLanguage" as any
    ).value;
    if (prevNativeLanguage && !nativeLanguage) {
      UserSetting.set(
        UserSettingKeyEnum.NATIVE_LANGUAGE,
        prevNativeLanguage as string
      );
    }

    // Learning Language
    const learningLanguage = await UserSetting.get(
      UserSettingKeyEnum.LEARNING_LANGUAGE
    );
    const prevLearningLanguage = config.getAppSetting(
      "learningLanguage" as any
    ).value;
    if (prevLearningLanguage && !learningLanguage) {
      UserSetting.set(
        UserSettingKeyEnum.LEARNING_LANGUAGE,
        prevLearningLanguage as string
      );
    }

    // STT Engine
    const sttEngine = await UserSetting.get(UserSettingKeyEnum.STT_ENGINE);
    const prevSttEngine = config.getAppSetting("whisper.service" as any).value;
    if (prevSttEngine && !sttEngine) {
      switch (prevSttEngine) {
        case "azure":
          UserSetting.set(
            UserSettingKeyEnum.STT_ENGINE,
            SttEngineOptionEnum.ENJOY_AZURE
          );
          break;
        case "cloudflare":
          UserSetting.set(
            UserSettingKeyEnum.STT_ENGINE,
            SttEngineOptionEnum.ENJOY_CLOUDFLARE
          );
          break;
        case "openai":
          UserSetting.set(
            UserSettingKeyEnum.STT_ENGINE,
            SttEngineOptionEnum.OPENAI
          );
          break;
        default:
          break;
      }
    }

    // Whisper
    const whisper = await UserSetting.get(UserSettingKeyEnum.WHISPER);
    const prevWhisper = config.getAppSetting("whisper.model" as any).value;
    if (prevWhisper && !whisper) {
      UserSetting.set(UserSettingKeyEnum.WHISPER, prevWhisper as string);
    }

    // Profile
    const profile = await UserSetting.get(UserSettingKeyEnum.PROFILE);
    const prevProfile = config.getAppSetting("user" as any).value;
    if (prevProfile && !profile) {
      UserSetting.set(UserSettingKeyEnum.PROFILE, prevProfile as UserType);
    }

    // Recorder Config
    const recorderConfig = await UserSetting.get(UserSettingKeyEnum.RECORDER);
    const prevRecorderConfig = config.getAppSetting(
      "recorderConfig" as any
    ).value;
    if (prevRecorderConfig && !recorderConfig) {
      UserSetting.set(
        UserSettingKeyEnum.RECORDER,
        prevRecorderConfig as string
      );
    }
  }
}
