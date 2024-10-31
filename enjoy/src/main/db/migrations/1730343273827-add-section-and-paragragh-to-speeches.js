import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  await queryInterface.addColumn("speeches", "section", {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  });
  await queryInterface.addColumn("speeches", "paragraph", {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  });
}

async function down({ context: queryInterface }) {
  await queryInterface.removeColumn("speeches", "section");
  await queryInterface.removeColumn("speeches", "paragraph");
}

export { up, down };
