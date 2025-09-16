const express = require('express');
const cors = require('cors');
const db = require('./db.js'); // Conector do Supabase (PostgreSQL)
const app = express();

// O Render define a porta automaticamente, mas definimos 3000 como padrão para o teste local
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
    res.send('API do Sistema de Compras está funcionando!');
});

// --- API PARA USUÁRIOS (Login/Cadastro) ---
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // ATENÇÃO: Em um projeto real, a senha deve ser criptografada (hashed) antes de salvar!
        const result = await db.query(
            'INSERT INTO usuarios (username, password_hash) VALUES ($1, $2) RETURNING id',
            [username, password]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Usuário cadastrado com sucesso!' });
    } catch (err) {
        if (err.code === '23505') { // Código de erro para violação de chave única (usuário já existe)
            return res.status(400).json({ message: 'Este nome de usuário já existe.' });
        }
        console.error('Erro ao cadastrar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
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
        console.error('Erro ao fazer login:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// --- API PARA FORNECEDORES ---
app.get('/api/fornecedores', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM fornecedores ORDER BY nome ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar fornecedores:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/fornecedores', async (req, res) => {
    const { filial, nome, cnpj, pagamento, acordo, inicioVigencia, finalVigencia, acao } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO fornecedores (filial, nome, cnpj, pagamento, acordo, inicio_vigencia, final_vigencia, acao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [filial, nome, cnpj, pagamento, acordo, inicioVigencia || null, finalVigencia || null, acao]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Fornecedor adicionado!' });
    } catch (err) {
        console.error('Erro ao adicionar fornecedor:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Adicione aqui as rotas para Contratos, Requisições, etc., quando precisar delas

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});