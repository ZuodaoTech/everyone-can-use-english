import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.createTable(
    "segments",
    {
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
      md5: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      segment_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      caption: {
        type: DataTypes.JSON,
      },
      start_time: {
        type: DataTypes.NUMBER,
      },
      end_time: {
        type: DataTypes.NUMBER,
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
          fields: ["target_type", "target_id"],
        },
        {
          fields: ["md5"],
        },
      ],
    }
  );
}

async function down({ context: queryInterface }) {
  queryInterface.dropTable("segments");
}

export { up, down };
