import { DataTypes } from "sequelize";

async function up({ context: queryInterface }) {
  queryInterface.addColumn("recordings", "deleted_at", {
    type: DataTypes.DATE,
  });
}

async function down({ context: queryInterface }) {
  queryInterface.removeColumn("recordings", "deleted_at");
}

export { up, down };
