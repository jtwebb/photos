const mysql = require('mysql');

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      user: 'photos',
      database: 'photos',
      password: '123456',
      host: 'localhost',
      multipleStatements: true,
      connectionLimit: 50,
      queueLimit: 0
    });
  }

  return pool;
}

function query(sql, args = []) {
  return new Promise((resolve, reject) => {
    const db = getPool();
    db.query(sql, args, (error, results, fields) => {
      if (error) {
        return reject(error);
      }

      resolve([results, fields]);
    });
  });
}

module.exports = { getPool, query };
