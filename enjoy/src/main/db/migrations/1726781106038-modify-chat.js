import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.addColumn("chats", "type", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.removeColumn("chats", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.removeColumn("chats", "topic", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.renameColumn(
    "chat_agents",
    "introduction",
    "description"
  );

  await queryInterface.addColumn("chat_agents", "type", {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "GPT",
  });

  await queryInterface.addColumn("chat_agents", "avatar_url", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("chat_agents", "source", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.removeColumn("chat_agents", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("chat_messages", "role", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("chat_messages", "category", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("chat_messages", "agent_id", {
    type: DataTypes.UUID,
    allowNull: true,
  });

  await queryInterface.addColumn("chat_messages", "mentions", {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true,
  });

  await queryInterface.changeColumn("chat_messages", "member_id", {
    type: DataTypes.UUID,
    allowNull: true,
  });

  await queryInterface.addIndex("chat_members", ["chat_id", "user_id"], {
    unique: true,
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.removeColumn("chats", "type", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("chats", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("chats", "topic", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.renameColumn(
    "chat_agents",
    "description",
    "introduction"
  );

  await queryInterface.removeColumn("chat_agents", "type", {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "GPT",
  });

  await queryInterface.removeColumn("chat_agents", "avatar_url", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.removeColumn("chat_agents", "source", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("chat_agents", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.removeColumn("chat_messages", "mentions", {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true,
  });

  await queryInterface.removeColumn("chat_messages", "role", {
    type: DataTypes.STRING,
    allowNull: false,
  });

  await queryInterface.removeColumn("chat_messages", "category", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.removeColumn("chat_messages", "agent_id", {
    type: DataTypes.UUID,
    allowNull: true,
  });

  await queryInterface.changeColumn("chat_messages", "member_id", {
    type: DataTypes.UUID,
    allowNull: false,
  });

  await queryInterface.removeIndex("chat_members", ["chat_id", "user_id"]);
}

export { up, down };
