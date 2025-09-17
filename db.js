// db.js - VERSÃO FINAL COM CORREÇÃO DE SSL
const { Pool } = require('pg');

// Cole aqui a URL de conexão da OPÇÃO DO MEIO (Transaction Pooler) com sua senha
const connectionString = 'postgresql://postgres.giamvztgxpaswawapnhx:Gilbrinks2027@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'; 

const pool = new Pool({
    connectionString: `${connectionString}?sslmode=require`,
    ssl: {
        rejectUnauthorized: false // <-- A CORREÇÃO PARA O ERRO DE CERTIFICADO
    }
});

console.log('Pool de conexões [VERSÃO POOLER COM SSL FIX] criado.');

module.exports = pool;