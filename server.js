const express = require('express');
const cors = require('cors');
const db = require('./db.js'); // Usando o novo arquivo db.js
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Rota para obter todas as requisições
app.get('/api/requisicoes', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM requisicoes ORDER BY id DESC');
        res.json({ requisicoes: result.rows });
    } catch (err) {
        console.error('Erro ao buscar requisições:', err);
        res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
});

// Rota para adicionar uma nova requisição
app.post('/api/requisicoes', async (req, res) => {
    const { tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO requisicoes (tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status]
        );
        res.status(201).json({
            message: 'Requisição adicionada com sucesso!',
            id: result.rows[0].id
        });
    } catch (err) {
        console.error('Erro ao adicionar requisição:', err);
        res.status(400).json({ error: 'Erro ao salvar dados.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});