if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const db = require('knex')({
  client: 'pg',
  useNullAsDefault: true,
  connection: process.env.DATABASE_REF_URL,
  pool: { min: 0, max: 7 }
});

module.exports = db;