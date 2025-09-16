const express = require('express');
const cors = require('cors');
const db = require('./db.js'); // Conector do Supabase (PostgreSQL)
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
    res.send('API do Sistema de Compras está funcionando!');
});

// --- API PARA USUÁRIOS (Login/Cadastro) ---
app.post('/api/register', async (req, res) => { /* ... código já fornecido ... */ });
app.post('/api/login', async (req, res) => { /* ... código já fornecido ... */ });

// --- API PARA FORNECEDORES ---
app.get('/api/fornecedores', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM fornecedores ORDER BY nome ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/fornecedores', async (req, res) => {
    const { filial, nome, cnpj, pagamento, acordo, inicioVigencia, finalVigencia, acao } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO fornecedores (filial, nome, cnpj, pagamento, acordo, inicio_vigencia, final_vigencia, acao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [filial, nome, cnpj, pagamento, acordo, inicioVigencia || null, finalVigencia || null, acao]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/fornecedores/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM fornecedores WHERE id = $1', [req.params.id]);
        res.sendStatus(204); // No Content
    } catch(err) { res.status(500).json({ error: err.message }); }
});


// --- API PARA REQUISIÇÕES ---
app.get('/api/requisicoes/:status', async(req, res) => {
    const { status } = req.params;
    try {
        const result = await db.query('SELECT * FROM requisicoes WHERE status = $1 ORDER BY id DESC', [status]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/requisicoes', async (req, res) => {
    const { tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO requisicoes (tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status]
        );
        res.status(201).json({ id: result.rows[0].id });
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

// --- API PARA CONTRATOS ---
// ... (Adicionar rotas GET, POST, DELETE para contratos aqui)

// --- API PARA DASHBOARD ---
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const pagamentosPendentesQuery = db.query("SELECT COUNT(*) FROM requisicoes WHERE status = 'pagamento_pendente'");
        const pagamentosRealizadosQuery = db.query("SELECT COUNT(*) FROM requisicoes WHERE status = 'pago'");
        // Adapte as queries abaixo para a sua lógica de contratos
        const contratosRealizadosQuery = db.query("SELECT COUNT(*) FROM contratos WHERE status = 'Ativo'"); 
        const contratosPendentesQuery = db.query("SELECT COUNT(*) FROM contratos WHERE status = 'Pendente'");

        const [pagamentosPendentes, pagamentosRealizados, contratosRealizados, contratosPendentes] = await Promise.all([
            pagamentosPendentesQuery, pagamentosRealizadosQuery, contratosRealizadosQuery, contratosPendentesQuery
        ]);

        res.json({
            pagamentos_pendentes: parseInt(pagamentosPendentes.rows[0].count),
            pagamentos_realizados: parseInt(pagamentosRealizados.rows[0].count),
            contratos_realizados: parseInt(contratosRealizados.rows[0].count),
            contratos_pendentes: parseInt(contratosPendentes.rows[0].count),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});