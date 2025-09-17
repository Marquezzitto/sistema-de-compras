// db.js
const { Pool } = require('pg');

// Cole a SUA URL de conexão completa do Supabase aqui
const connectionString = 'postgresql://postgres:Gilbrinks2027@db.giamvztgxpaswawapnhx.supabase.co:5432/postgres'; 

const pool = new Pool({
    connectionString,
    family: 4, // <-- A LINHA MÁGICA: Força o uso de IPv4
});

console.log('Pool de conexões com PostgreSQL (Supabase) criado, forçando IPv4.');

module.exports = pool;