import {
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  DataType,
  AllowNull,
} from "sequelize-typescript";
import log from "@main/logger";
import settings from "@main/settings";
import * as i18n from "i18next";
import { SttEngineOptionEnum, UserSettingKeyEnum } from "@/types/enums";

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

  static async get(key: UserSettingKeyEnum): Promise<any> {
    const setting = await UserSetting.findOne({ where: { key } });
    if (!setting) return null;

    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  }

  static async set(key: UserSettingKeyEnum, value: any): Promise<void> {
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

  static async migrateFromSettings(): Promise<void> {
    // hotkeys
    const hotkeys = await UserSetting.get(UserSettingKeyEnum.HOTKEYS);
    const prevHotkeys = await settings.get("defaultHotkeys");
    if (prevHotkeys && !hotkeys) {
      UserSetting.set(UserSettingKeyEnum.HOTKEYS, prevHotkeys as object);
    }

    // GPT Engine
    const gptEngine = await UserSetting.get(UserSettingKeyEnum.GPT_ENGINE);
    const prevGptEngine = await settings.get("engine.gpt");
    if (prevGptEngine && !gptEngine) {
      UserSetting.set(UserSettingKeyEnum.GPT_ENGINE, prevGptEngine as object);
    }

    // OpenAI API Key
    const openai = await UserSetting.get(UserSettingKeyEnum.OPENAI);
    const prevOpenai = await settings.get("openai");
    if (prevOpenai && !openai) {
      UserSetting.set(UserSettingKeyEnum.OPENAI, prevOpenai as object);
    }

    // Language
    const language = await UserSetting.get(UserSettingKeyEnum.LANGUAGE);
    const prevLanguage = await settings.get("language");
    if (prevLanguage && !language) {
      UserSetting.set(UserSettingKeyEnum.LANGUAGE, prevLanguage as string);
    }

    // Native Language
    const nativeLanguage = await UserSetting.get(
      UserSettingKeyEnum.NATIVE_LANGUAGE
    );
    const prevNativeLanguage = await settings.get("nativeLanguage");
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
    const prevLearningLanguage = await settings.get("learningLanguage");
    if (prevLearningLanguage && !learningLanguage) {
      UserSetting.set(
        UserSettingKeyEnum.LEARNING_LANGUAGE,
        prevLearningLanguage as string
      );
    }

    // STT Engine
    const sttEngine = await UserSetting.get(UserSettingKeyEnum.STT_ENGINE);
    const prevSttEngine = await settings.get("whisper.service");
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
    const prevWhisper = await settings.get("whisper.model");
    if (prevWhisper && !whisper) {
      UserSetting.set(UserSettingKeyEnum.WHISPER, prevWhisper as string);
    }

    // Profile
    const profile = await UserSetting.get(UserSettingKeyEnum.PROFILE);
    const prevProfile = (await settings.get("user")) as UserType;
    if (prevProfile && !profile) {
      UserSetting.set(UserSettingKeyEnum.PROFILE, prevProfile as UserType);
    }

    // Recorder Config
    const recorderConfig = await UserSetting.get(UserSettingKeyEnum.RECORDER);
    const prevRecorderConfig = await settings.get("recorderConfig");
    if (prevRecorderConfig && !recorderConfig) {
      UserSetting.set(
        UserSettingKeyEnum.RECORDER,
        prevRecorderConfig as string
      );
    }
  }
}
