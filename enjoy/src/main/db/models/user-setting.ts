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

const logger = log.scope("db/setting");

@Table({
  modelName: "Setting",
  tableName: "settings",
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

  static async get(key: string): Promise<UserSetting["value"] | null> {
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
}
