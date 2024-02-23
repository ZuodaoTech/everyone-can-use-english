import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.createTable(
    "recordings",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      target_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      target_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      reference_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reference_text: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      duration: {
        type: DataTypes.NUMBER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      md5: {
        type: DataTypes.STRING,
        allowNull: false,
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
  queryInterface.dropTable("recordings");
}

export { up, down };
