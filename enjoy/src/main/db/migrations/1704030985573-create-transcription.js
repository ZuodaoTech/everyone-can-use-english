import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.createTable(
    "transcriptions",
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
      target_md5: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      engine: {
        type: DataTypes.STRING,
      },
      model: {
        type: DataTypes.STRING,
      },
      result: {
        type: DataTypes.JSON,
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
  queryInterface.dropTable("transcriptions");
}

export { up, down };
