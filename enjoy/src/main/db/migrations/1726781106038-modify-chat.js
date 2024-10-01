import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.addColumn("chats", "type", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("chats", "contextBreaks", {
    type: DataTypes.JSON,
    defaultValue: [],
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
  });

  await queryInterface.addColumn("chat_agents", "avatarUrl", {
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

  await queryInterface.addColumn("chat_messages", "mentions", {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true,
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.removeColumn("chats", "type", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.removeColumn("chats", "contextBreaks", {
    type: DataTypes.JSON,
    defaultValue: [],
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
  });

  await queryInterface.removeColumn("chat_agents", "avatarUrl", {
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
}

export { up, down };
