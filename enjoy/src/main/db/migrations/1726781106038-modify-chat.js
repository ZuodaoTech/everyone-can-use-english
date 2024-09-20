import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.addColumn("chats", "type", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  queryInterface.addColumn("chats", "contextBreaks", {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true,
  });

  queryInterface.removeColumn("chats", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  queryInterface.addColumn("chat_agents", "source", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  queryInterface.removeColumn("chat_agents", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

async function down({ context: queryInterface }) {
  queryInterface.removeColumn("chats", "type", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  queryInterface.removeColumn("chats", "contextBreaks", {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true,
  });

  queryInterface.addColumn("chats", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  queryInterface.removeColumn("chat_agents", "source", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  queryInterface.addColumn("chat_agents", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export { up, down };
