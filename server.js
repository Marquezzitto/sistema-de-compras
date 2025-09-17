// server.js - VERSÃO FINAL PARA MONGODB ATLAS
const express = require('express');
const cors = require('cors');
const db = require('./db.js'); // Nosso conector para o MongoDB
const { ObjectId } = require('mongodb'); // Ferramenta para trabalhar com IDs do MongoDB
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Rota de Teste ---
app.get('/', (req, res) => {
    res.send('API do Sistema de Compras com MongoDB está funcionando!');
});

// --- API PARA USUÁRIOS (Login/Cadastro) ---
app.post('/api/register', async (req, res) => {
    try {
        const db_connect = db.getDb();
        const newUser = {
            username: req.body.username,
            password_hash: req.body.password
        };
        await db_connect.collection('usuarios').insertOne(newUser);
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (e) {
        res.status(400).json({ message: 'Erro ao criar usuário. O nome de usuário pode já existir.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const db_connect = db.getDb();
        const user = await db_connect.collection('usuarios').findOne({ username: req.body.username });

        if (user && user.password_hash === req.body.password) {
            res.status(200).json({ message: 'Login bem-sucedido!' });
        } else {
            res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }
    } catch(e) {
        res.status(500).json({ message: 'Erro interno no servidor.'});
    }
});

// --- API PARA FORNECEDORES ---
app.get('/api/fornecedores', async (req, res) => {
    try {
        const db_connect = db.getDb();
        // .find({}).toArray() é o novo 'SELECT * FROM fornecedores'
        const result = await db_connect.collection('fornecedores').find({}).sort({ nome: 1 }).toArray();
        res.json(result);
    } catch (e) {
        res.status(500).json({ message: 'Erro ao buscar fornecedores.' });
    }
});

app.post('/api/fornecedores', async (req, res) => {
    try {
        const db_connect = db.getDb();
        const newFornecedor = req.body;
        // .insertOne() é o novo 'INSERT INTO ...'
        const result = await db_connect.collection('fornecedores').insertOne(newFornecedor);
        res.status(201).json(result);
    } catch (e) {
        res.status(400).json({ message: 'Erro ao adicionar fornecedor.' });
    }
});

app.delete('/api/fornecedores/:id', async (req, res) => {
    try {
        const db_connect = db.getDb();
        const query = { _id: new ObjectId(req.params.id) };
        // .deleteOne() é o novo 'DELETE FROM ...'
        await db_connect.collection('fornecedores').deleteOne(query);
        res.sendStatus(204); // No Content
    } catch(e) {
        res.status(500).json({ message: 'Erro ao deletar fornecedor.' });
    }
});

// --- API PARA REQUISIÇÕES ---
app.get('/api/requisicoes/:status', async(req, res) => {
    try {
        const db_connect = db.getDb();
        const result = await db_connect.collection('requisicoes').find({ status: req.params.status }).toArray();
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/requisicoes', async (req, res) => {
    try {
        const db_connect = db.getDb();
        const result = await db_connect.collection('requisicoes').insertOne(req.body);
        res.status(201).json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/requisicoes/:id/status', async (req, res) => {
    try {
        const db_connect = db.getDb();
        const query = { _id: new ObjectId(req.params.id) };
        const newStatus = { $set: { status: req.body.status } };
        // .updateOne() é o novo 'UPDATE ... SET ...'
        await db_connect.collection('requisicoes').updateOne(query, newStatus);
        res.status(200).json({ message: 'Status atualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API PARA DASHBOARD ---
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const db_connect = db.getDb();
        // .countDocuments() é o novo 'SELECT COUNT(*)'
        const pagamentosPendentes = await db_connect.collection('requisicoes').countDocuments({ status: 'pagamento_pendente' });
        const pagamentosRealizados = await db_connect.collection('requisicoes').countDocuments({ status: 'pago' });
        const contratosRealizados = await db_connect.collection('contratos').countDocuments({ status: 'Ativo' });
        const contratosPendentes = await db_connect.collection('contratos').countDocuments({ status: 'Pendente' });

        res.json({
            pagamentos_pendentes: pagamentosPendentes,
            pagamentos_realizados: pagamentosRealizados,
            contratos_realizados: contratosRealizados,
            contratos_pendentes: contratosPendentes,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Conecta ao DB e, SOMENTE DEPOIS, inicia o servidor
db.connectToServer().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}).catch(err => {
    console.error("Falha ao iniciar o servidor:", err);
});