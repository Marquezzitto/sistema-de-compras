// api/index.js - VERSÃO FINAL PARA VERCEL (PostgreSQL)
const express = require('express');
const cors = require('cors');
const db = require('../db.js'); // O caminho mudou para '../db.js'
const app = express();

app.use(cors());
app.use(express.json());

// --- API PARA USUÁRIOS (Login/Cadastro) ---
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO usuarios (username, password_hash) VALUES ($1, $2) RETURNING id',
            [username, password]
        );
        res.status(201).json({ message: 'Usuário criado com sucesso!', id: result.rows[0].id });
    } catch (e) {
        if (e.code === '23505') { // Código de erro do PostgreSQL para duplicados
            return res.status(400).json({ message: 'Este nome de usuário já existe.' });
        }
        res.status(500).json({ message: 'Erro ao criar usuário.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE username = $1 AND password_hash = $2', [username, password]);
        if (result.rows.length > 0) {
            res.status(200).json({ message: 'Login bem-sucedido!' });
        } else {
            res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API PARA FILIAIS ---
app.get('/api/filiais', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM filiais ORDER BY nome ASC');
        res.json(result.rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- API PARA FORNECEDORES (AJUSTADA PARA FILTRAR POR FILIAL E "NAC") ---
app.get('/api/fornecedores', async (req, res) => {
    const { filial } = req.query;
    let query = 'SELECT * FROM fornecedores';
    const params = [];

    if (filial && filial.toLowerCase() !== 'todas') {
        query += ' WHERE filial = $1 OR filial = $2';
        params.push(filial, 'NAC');
    }

    query += ' ORDER BY nome ASC';

    try {
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NOVA ROTA PARA BUSCA DE FORNECEDORES (AUTOCOMPLETE)
app.get('/api/fornecedores/search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: 'O parâmetro de busca "query" é obrigatório.' });
    }

    try {
        const result = await db.query(
            'SELECT nome, cnpj, filial, acao FROM fornecedores WHERE nome ILIKE $1 OR cnpj ILIKE $1 ORDER BY nome ASC',
            [`%${query}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/fornecedores', async (req, res) => {
    const { filial, nome, cnpj, pagamento, acordo, inicioVigencia, finalVigencia, acao } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO fornecedores (filial, nome, cnpj, pagamento, acordo, inicio_vigencia, final_vigencia, acao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [filial, nome, cnpj, pagamento, acordo, inicioVigencia || null, finalVigencia || null, acao]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/fornecedores/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM fornecedores WHERE id = $1', [req.params.id]);
        res.sendStatus(204);
    } catch(err) { res.status(500).json({ error: err.message }); }
});

// Nova rota para editar fornecedores
app.put('/api/fornecedores/:id', async (req, res) => {
    const { filial, nome, cnpj, pagamento, acordo, inicioVigencia, finalVigencia, acao } = req.body;
    const { id } = req.params;
    try {
        await db.query(
            'UPDATE fornecedores SET filial = $1, nome = $2, cnpj = $3, pagamento = $4, acordo = $5, inicio_vigencia = $6, final_vigencia = $7, acao = $8 WHERE id = $9',
            [filial, nome, cnpj, pagamento, acordo, inicioVigencia || null, finalVigencia || null, acao, id]
        );
        res.status(200).json({ message: 'Fornecedor atualizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API PARA REQUISIÇÕES (AJUSTADA PARA FILTRAR POR FILIAL) ---
app.get('/api/requisicoes/:status', async(req, res) => {
    const { status } = req.params;
    const { filial } = req.query;
    const params = [status];
    let query = 'SELECT * FROM requisicoes WHERE status = $1';

    if (filial && filial.toLowerCase() !== 'todas') {
        query += ' AND (LOWER(unaccent(filial)) = LOWER(unaccent($2)) OR filial IS NULL OR filial = $3)';
        params.push(filial, '');
    }
    
    query += ' ORDER BY id DESC';

    try {
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rota de criação de requisição
app.post('/api/requisicoes', async (req, res) => {
    const { tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO requisicoes (tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [tipo, data, requisicao, fornecedor, filial, nf || null, oc || null, observacao || null, status || 'pendente']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/requisicoes/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query('UPDATE requisicoes SET status = $1 WHERE id = $2', [status, id]);
        res.status(200).json({ message: 'Status atualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Nova rota para aprovar e direcionar a requisição
app.put('/api/requisicoes/:id/aprovar', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Encontrar o fornecedor da requisição
        const requisicaoResult = await db.query('SELECT fornecedor FROM requisicoes WHERE id = $1', [id]);
        if (requisicaoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Requisição não encontrada.' });
        }
        const fornecedorNome = requisicaoResult.rows[0].fornecedor;
        
        // 2. Encontrar a ação do fornecedor
        const fornecedorResult = await db.query('SELECT acao FROM fornecedores WHERE nome = $1', [fornecedorNome]);
        if (fornecedorResult.rows.length === 0) {
            return res.status(404).json({ message: 'Fornecedor não encontrado.' });
        }
        const acaoFornecedor = fornecedorResult.rows[0].acao;

        // 3. Decidir o novo status baseado na ação
        let novoStatus = 'pagamento_pendente';
        if (acaoFornecedor.includes('XML')) {
            novoStatus = 'fiscal_xml';
        } else if (acaoFornecedor.includes('PAGAMENTO')) {
            novoStatus = 'fiscal_pagamento';
        }

        // 4. Atualizar o status da requisição
        await db.query('UPDATE requisicoes SET status = $1 WHERE id = $2', [novoStatus, id]);
        res.status(200).json({ message: `Requisição aprovada e direcionada para ${novoStatus}!` });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API PARA CONTRATOS (AJUSTADA PARA FILTRAR POR FILIAL) ---
app.get('/api/contratos', async (req, res) => {
    const { filial } = req.query;
    let query = 'SELECT * FROM contratos';
    const params = [];
    
    if (filial && filial.toLowerCase() !== 'todas') {
        query += ' WHERE filial = $1';
        params.push(filial);
    }

    query += ' ORDER BY id DESC';

    try {
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rota de criação de contrato
app.post('/api/contratos', async (req, res) => {
    const { numero, fornecedor, inicio, fim, valor, status, filial } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO contratos (numero, fornecedor, inicio, fim, valor, status, filial) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [numero, fornecedor, inicio, fim, valor, status, filial]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- API PARA DASHBOARD ---
app.get('/api/dashboard-stats', async (req, res) => {
    const { filial } = req.query;
    const params = [];
    let pagamentosPendentesQuery = "SELECT COUNT(*) FROM requisicoes WHERE status = 'pagamento_pendente'";
    let pagamentosRealizadosQuery = "SELECT COUNT(*) FROM requisicoes WHERE status = 'pago'";
    let contratosRealizadosQuery = "SELECT COUNT(*) FROM contratos WHERE status = 'Ativo'";
    let contratosPendentesQuery = "SELECT COUNT(*) FROM contratos WHERE status = 'Pendente'";

    if (filial && filial.toLowerCase() !== 'todas') {
        pagamentosPendentesQuery += ` AND LOWER(unaccent(filial)) = LOWER(unaccent($1))`;
        pagamentosRealizadosQuery += ` AND LOWER(unaccent(filial)) = LOWER(unaccent($1))`;
        contratosRealizadosQuery += ` AND LOWER(unaccent(filial)) = LOWER(unaccent($1))`;
        contratosPendentesQuery += ` AND LOWER(unaccent(filial)) = LOWER(unaccent($1))`;
        params.push(filial);
    }

    try {
        const [pagamentosPendentes, pagamentosRealizados, contratosRealizados, contratosPendentes] = await Promise.all([
            db.query(pagamentosPendentesQuery, params),
            db.query(pagamentosRealizadosQuery, params),
            db.query(contratosRealizadosQuery, params),
            db.query(contratosPendentesQuery, params)
        ]);

        res.json({
            pagamentos_pendentes: parseInt(pagamentosPendentes.rows[0].count),
            pagamentos_realizados: parseInt(pagamentosRealizados.rows[0].count),
            contratos_realizados: parseInt(contratosRealizados.rows[0].count),
            contratos_pendentes: parseInt(contratosPendentesResult.rows[0].count),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Exporta o app para a Vercel usar
module.exports = app;
