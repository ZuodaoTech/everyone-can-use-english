import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.createTable(
    "audios",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      source: {
        type: DataTypes.STRING,
      },
      md5: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      cover_url: {
        type: DataTypes.STRING,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      metadata: {
        type: DataTypes.JSON,
      },
      recordings_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      recordings_duration: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      start_transcribing_at: {
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
          unique: true,
          fields: ["md5"],
        },
      ],
    }
  );
}

async function down({ context: queryInterface }) {
  queryInterface.dropTable("audios");
}

export { up, down };
