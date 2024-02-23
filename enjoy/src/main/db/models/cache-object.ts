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

const logger = log.scope("cache-object");

@Table({
  modelName: "CacheObject",
  tableName: "cache_objects",
  underscored: true,
  timestamps: true,
})
export class CacheObject extends Model<CacheObject> {
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.STRING)
  key: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  value: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  ttl: number;

  @Column(DataType.VIRTUAL)
  get isExpired(): boolean {
    return (
      this.ttl > 0 && this.updatedAt.getTime() + this.ttl * 1000 < Date.now()
    );
  }

  static async get(key: string): Promise<CacheObject["value"] | null> {
    const cacheObject = await CacheObject.findOne({ where: { key } });
    if (!cacheObject) return null;

    if (cacheObject.isExpired) {
      await cacheObject.destroy();
      return null;
    }

    try {
      return JSON.parse(cacheObject.value);
    } catch {
      return cacheObject.value;
    }
  }

  static async set(
    key: string,
    value: object | string,
    ttl: number
  ): Promise<void> {
    const cacheObject = await CacheObject.findOne({ where: { key } });

    if (typeof value === "object") {
      value = JSON.stringify(value);
    }

    if (cacheObject) {
      await cacheObject.update({ value, ttl });
    } else {
      await CacheObject.create({ key, value, ttl });
    }
  }
}
