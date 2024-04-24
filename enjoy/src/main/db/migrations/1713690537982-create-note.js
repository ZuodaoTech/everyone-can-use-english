import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.createTable("notes", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    target_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    parameters: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    synced_at: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });
}

async function down({ context: queryInterface }) {
  queryInterface.dropTable("notes");
}

export { up, down };
