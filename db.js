// db.js - VERSÃO FINAL USANDO O POOLER
const { Pool } = require('pg');

// URL de conexão do Transaction Pooler com a sua senha já inserida
const connectionString = 'postgresql://postgres.giamvztgxpaswawapnhx:Gilbrinks2027@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'; 

const pool = new Pool({
    // Adicionamos ?sslmode=require para garantir a conexão segura
    connectionString: `${connectionString}?sslmode=require`,
    ssl: {
        rejectUnauthorized: false // Correção para o erro de certificado
    }
});

console.log('Pool de conexões [VERSÃO POOLER FINAL] criado.');

module.exports = pool;