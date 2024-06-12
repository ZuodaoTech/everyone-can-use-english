import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.addColumn("audios", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  queryInterface.addColumn("videos", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  queryInterface.addColumn("transcriptions", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  queryInterface.addColumn("recordings", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  queryInterface.addColumn("pronunciation_assessments", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

async function down({ context: queryInterface }) {
  queryInterface.removeColumn("audios", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  queryInterface.removeColumn("videos", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  queryInterface.removeColumn("transcriptions", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  queryInterface.removeColumn("recordings", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  queryInterface.removeColumn("pronunciation_assessments", "language", {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export { up, down };
