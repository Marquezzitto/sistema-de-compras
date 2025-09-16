// db.js
const { Pool } = require('pg');

// COLE A SUA URL DE CONEXÃO DO SUPABASE AQUI DENTRO DAS ASPAS
const connectionString = 'postgresql://postgres:Gilbrinks2027@db.giamvztgxpaswawapnhx.supabase.co:5432/postgres'; 

// =============================================================
// ATENÇÃO: Lembre-se de substituir [YOUR-PASSWORD] na URL
// pela senha que você criou no Supabase!
// =============================================================

const pool = new Pool({
    connectionString,
});

console.log('Pool de conexões com PostgreSQL (Supabase) criado.');

module.exports = pool;