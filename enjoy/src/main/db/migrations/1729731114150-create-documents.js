import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.createTable(
    "documents",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      md5: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      language: {
        type: DataTypes.STRING,
      },
      cover_url: {
        type: DataTypes.STRING,
      },
      source: {
        type: DataTypes.STRING,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      config: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      last_read_position: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      last_read_at: {
        type: DataTypes.DATE,
      },
      synced_at: {
        type: DataTypes.DATE,
      },
      uploaded_at: {
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
    },
    {
      indexes: [
        {
          fields: ["md5"],
          unique: true,
        },
      ],
    }
  );
}

async function down({ context: queryInterface }) {
  queryInterface.dropTable("documents");
}

export { up, down };
