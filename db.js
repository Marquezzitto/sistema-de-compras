// db.js - VERSÃO FINAL COM IP DIRETO
const { Pool } = require('pg');

const pool = new Pool({
    host: '34.95.76.142', // <-- O ENDEREÇO IPV4 DIRETO DO SEU BANCO DE DADOS
    user: 'postgres.giamvztgxpaswawapnhx',
    password: 'Gilbrinks2027',
    database: 'postgres',
    port: 5432,
});

console.log('Pool de conexões [VERSÃO IP DIRETO] criado.');

module.exports = pool;