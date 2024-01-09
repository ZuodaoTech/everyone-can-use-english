import {
  AfterCreate,
  AfterDestroy,
  BelongsTo,
  BeforeDestroy,
  ForeignKey,
  Scopes,
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  DataType,
  AllowNull,
  HasMany,
} from "sequelize-typescript";
import { Conversation, Speech } from "@main/db/models";
import mainWindow from "@main/window";

@Table({
  modelName: "Message",
  tableName: "messages",
  underscored: true,
  timestamps: true,
})
@Scopes(() => ({
  withConversation: {
    include: [Conversation],
  },
  asc: {
    order: [["createdAt", "ASC"]],
  },
  desc: {
    order: [["createdAt", "DESC"]],
  },
}))
export class Message extends Model<Message> {
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @BelongsTo(() => Conversation)
  conversation: Conversation;

  @ForeignKey(() => Conversation)
  @Column(DataType.UUIDV4)
  conversationId: string;

  @HasMany(() => Speech, {
    foreignKey: "sourceId",
    scope: { sourceType: "Message" },
  })
  speeches: Speech[];

  @AllowNull(false)
  @Column(DataType.ENUM("assistant", "user"))
  role: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  content: string;

  createSpeech(configuration: { [key: string]: any } = {}) {
    return Speech.generate({
      sourceId: this.id,
      sourceType: "Message",
      text: this.content,
      configuration,
    });
  }

  @AfterCreate
  static notifyForCreate(message: Message) {
    this.notify(message, "create");
  }

  @BeforeDestroy
  static destroyAllSpeeches(message: Message) {
    Speech.findAll({
      where: {
        sourceId: message.id,
        sourceType: "Message",
      },
    }).then((speeches) => speeches.forEach((speech) => speech.destroy()));
  }

  @AfterDestroy
  static notifyForDestroy(message: Message) {
    this.notify(message, "destroy");
  }

  static notify(message: Message, action: "create" | "update" | "destroy") {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Message",
      id: message.id,
      action: action,
      record: message.toJSON(),
    });
  }
}
