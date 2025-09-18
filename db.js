// db.js - Versão final para Vercel Postgres
const { Pool } = require('pg');

// A Vercel injeta a URL de conexão nesta variável de ambiente automaticamente
// quando você cria o banco de dados na aba "Storage".
if (!process.env.POSTGRES_URL) {
    throw new Error('Variável de ambiente POSTGRES_URL não foi encontrada. Crie o banco de dados na Vercel.');
}

const pool = new Pool({
    // Adicionamos "?sslmode=require" para garantir uma conexão segura
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

console.log('Pool de conexões com Vercel Postgres criado com sucesso.');

// Exportamos uma função query para ser usada pelo nosso servidor
module.exports = {
    query: (text, params) => pool.query(text, params),
};