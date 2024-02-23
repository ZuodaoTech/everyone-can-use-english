import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.createTable(
    "pronunciation_assessments",
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
      reference_text: {
        type: DataTypes.STRING,
      },
      accuracy_score: {
        type: DataTypes.FLOAT,
      },
      completeness_score: {
        type: DataTypes.FLOAT,
      },
      fluency_score: {
        type: DataTypes.FLOAT,
      },
      prosody_score: {
        type: DataTypes.FLOAT,
      },
      pronunciation_score: {
        type: DataTypes.FLOAT,
      },
      grammar_score: {
        type: DataTypes.FLOAT,
      },
      vocabulary_score: {
        type: DataTypes.FLOAT,
      },
      topic_score: {
        type: DataTypes.FLOAT,
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
          fields: ["recording_id"],
        },
      ],
    }
  );
}

async function down({ context: queryInterface }) {
  queryInterface.dropTable("pronunciation_assessments");
}

export { up, down };
