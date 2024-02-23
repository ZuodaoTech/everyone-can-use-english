import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.createTable(
    "speeches",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      source_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      source_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      configuration: {
        type: DataTypes.JSON,
      },
      md5: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      extname: {
        type: DataTypes.STRING,
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
    },
    {
      indexes: [
        {
          fields: ["source_type", "source_id"],
        },
        {
          fields: ["md5"],
        },
      ],
    }
  );
}

async function down({ context: queryInterface }) {
  queryInterface.dropTable("speeches");
}

export { up, down };
