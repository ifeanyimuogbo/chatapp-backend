import 'dotenv/config';
import Sequelize, { DataTypes } from 'sequelize';

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
  });
} else {
  sequelize = new Sequelize(
    process.env.TEST_DATABASE || process.env.DATABASE,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
      dialect: 'postgres',
    },
  );
}

// const sequelize = new Sequelize(
//   'postgres://postgres:admin@localhost/postgres',
// );
const models = {
  User: require('./user').default(sequelize, DataTypes),
  Message: require('./message').default(sequelize, DataTypes),
};
Object.keys(models).forEach((key) => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});
export { sequelize };
export default models;
