import { ipcMain, app } from "electron";
import path from "path";
import log from "@main/logger";
import url from "url";
import { Sequelize, DataType } from "sequelize-typescript";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = log.scope("camdict");

class Camdict {
  public dbPath = path.join(
    __dirname,
    "lib",
    "dictionaries",
    "cam_dict.refined.sqlite"
  );
  public sequelize: Sequelize;
  public db: any;

  constructor() {
    this.sequelize = new Sequelize({
      dialect: "sqlite",
      storage: this.dbPath,
    });
    this.sequelize.sync();
    this.sequelize.authenticate();
    this.db = this.sequelize.define(
      "Camdict",
      {
        id: {
          type: DataType.INTEGER,
          primaryKey: true,
        },
        oid: {
          type: DataType.STRING,
        },
        word: {
          type: DataType.STRING,
        },
        posItems: {
          type: DataType.JSON,
        },
      },
      {
        modelName: "Camdict",
        tableName: "camdict",
        underscored: true,
        timestamps: true,
      }
    );
  }

  async lookup(word: string) {
    const item = await this.db.findOne({
      where: { word: word.trim().toLowerCase() },
    });
    return item?.toJSON();
  }

  registerIpcHandlers() {
    ipcMain.handle("camdict-lookup", async (_event, word: string) => {
      return this.lookup(word);
    });
  }
}

export default new Camdict();
