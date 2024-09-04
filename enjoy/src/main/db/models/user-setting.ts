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

  static async get(key: UserSettingKey): Promise<UserSetting["value"] | null> {
    const setting = await UserSetting.findOne({ where: { key } });
    if (!setting) return null;

    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  }

  static async set(key: UserSettingKey, value: object | string): Promise<void> {
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
    if (key === UserSettingKey.LANGUAGE) {
      i18n.changeLanguage(value);
    }
  }

  static async migrateFromSettings(): Promise<void> {
    // hotkeys
    const hotkeys = await UserSetting.get(UserSettingKey.HOT_KEYS);
    const prevHotkeys = await settings.get("defaultHotkeys");
    if (prevHotkeys && !hotkeys) {
      UserSetting.set(UserSettingKey.HOT_KEYS, prevHotkeys as object);
    }

    // GPT Engine
    const gptEngine = await UserSetting.get(UserSettingKey.GPT_ENGINE);
    const prevGptEngine = await settings.get("engine.gpt");
    if (prevGptEngine && !gptEngine) {
      UserSetting.set(UserSettingKey.GPT_ENGINE, prevGptEngine as object);
    }

    // OpenAI API Key
    const openai = await UserSetting.get(UserSettingKey.OPENAI);
    const prevOpenai = await settings.get("openai");
    if (prevOpenai && !openai) {
      UserSetting.set(UserSettingKey.OPENAI, prevOpenai as object);
    }

    // Language
    const language = await UserSetting.get(UserSettingKey.LANGUAGE);
    const prevLanguage = await settings.get("language");
    if (prevLanguage && !language) {
      UserSetting.set(UserSettingKey.LANGUAGE, prevLanguage as string);
    }

    // Native Language
    const nativeLanguage = await UserSetting.get(
      UserSettingKey.NATIVE_LANGUAGE
    );
    const prevNativeLanguage = await settings.get("nativeLanguage");
    if (prevNativeLanguage && !nativeLanguage) {
      UserSetting.set(
        UserSettingKey.NATIVE_LANGUAGE,
        prevNativeLanguage as string
      );
    }

    // Learning Language
    const learningLanguage = await UserSetting.get(
      UserSettingKey.LEARNING_LANGUAGE
    );
    const prevLearningLanguage = await settings.get("learningLanguage");
    if (prevLearningLanguage && !learningLanguage) {
      UserSetting.set(
        UserSettingKey.LEARNING_LANGUAGE,
        prevLearningLanguage as string
      );
    }
  }
}
