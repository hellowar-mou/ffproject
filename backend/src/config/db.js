const oracledb = require('oracledb');
require('dotenv').config();

// CLOB কে string হিসেবে fetch
oracledb.fetchAsString = [ oracledb.CLOB ];

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// DB connection pool config
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  poolMin: 1,
  poolMax: 5,
  poolIncrement: 1
};

let pool;

// pool initialize করা
async function init() {
  if (!pool) {
    pool = await oracledb.createPool(dbConfig);
    console.log('Oracle DB pool created');
  }
  return pool;
}


// pool থেকে connection নেয়
async function getConnection() {
  if (!pool) await init();
  return await pool.getConnection();
}

module.exports = { init, getConnection, oracledb };