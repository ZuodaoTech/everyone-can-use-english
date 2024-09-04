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

  static async set(key: string, value: object | string): Promise<void> {
    const setting = await UserSetting.findOne({ where: { key } });

    if (typeof value === "object") {
      value = JSON.stringify(value);
    }

    if (setting) {
      await setting.update({ value });
    } else {
      await UserSetting.create({ key, value });
    }
  }

  static async migrateFromSettings(): Promise<void> {
    // hotkeys
    const hotkeys = await UserSetting.get(UserSettingKey.HOT_KEYS);
    const prevHotkeys = await settings.get("defaultHotkeys");
    if (prevHotkeys && !hotkeys) {
      UserSetting.set("hotkeys", prevHotkeys as object);
    }

    // GPT Engine
    const gptEngine = await UserSetting.get(UserSettingKey.GPT_ENGINE);
    const prevGptEngine = await settings.get("engine.gpt");
    if (prevGptEngine && !gptEngine) {
      UserSetting.set("gptEngine", prevGptEngine as object);
    }

    // OpenAI API Key
    const openai = await UserSetting.get(UserSettingKey.OPENAI);
    const prevOpenai = await settings.get("openai");
    if (prevOpenai && !openai) {
      UserSetting.set("openai", prevOpenai as object);
    }
  }
}
