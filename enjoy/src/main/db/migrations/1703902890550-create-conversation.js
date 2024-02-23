import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.createTable("conversations", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    engine: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    configuration: {
      type: DataTypes.JSON,
      allowNull: false,
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
  queryInterface.dropTable("conversations");
}

export { up, down };
