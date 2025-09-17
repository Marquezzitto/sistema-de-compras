// db.js - VERSÃO FINAL USANDO O POOLER
const { Pool } = require('pg');

// URL de conexão do Transaction Pooler com a sua senha já inserida
const connectionString = 'postgresql://postgres.giamvztgxpaswawapnhx:Gilbrinks2027@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'; 
//                                                              ^^^^^^^^^^^^^
//                                                          Sua senha foi inserida aqui

const pool = new Pool({
    // Adicionamos ?sslmode=require para garantir a conexão segura
    connectionString: `${connectionString}?sslmode=require`,
});

console.log('Pool de conexões [VERSÃO POOLER] criado.');

module.exports = pool;