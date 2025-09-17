// db.js - VERSÃO FINAL COM MONGODB ATLAS
const { MongoClient } = require('mongodb');

// COLE A SUA URL DE CONEXÃO DO MONGODB ATLAS AQUI
const connectionString = 'mongodb+srv://marcoshmarques_db_user:Gilbrinks2027@cluster0.upp35o5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(connectionString);

let dbConnection;

const connectToServer = async () => {
    try {
        await client.connect();
        dbConnection = client.db('sistema_compras'); // Podemos dar um nome ao nosso banco de dados
        console.log('Conectado com sucesso ao MongoDB Atlas!');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const getDb = () => {
    return dbConnection;
};

module.exports = { connectToServer, getDb };