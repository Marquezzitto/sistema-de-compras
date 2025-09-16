// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Coloque seu usuário do MySQL aqui
    password: 'sua_senha_aqui', // Coloque sua senha do MySQL aqui
    database: 'sistema_compras',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Pool de conexões com MySQL foi criado.');

module.exports = pool;