#!/usr/bin/env zx

const name = process.argv[3];
const filename = path.resolve(
  __dirname,
  "migrations",
  `${Date.now()}-${process.argv[3]}.js`
);

const template = `
const { DataTypes } = require("sequelize");

async function up({ context: queryInterface }) {
  // code here
}

async function down({ context: queryInterface }) {
  // code here
}

module.exports = { up, down };
`;

await fs.mkdir(path.resolve(__dirname, "migrations"), { recursive: true });
await fs.writeFile(filename, template.trim());

console.log(chalk.green(`Created migration ${name} at ${filename}`));
