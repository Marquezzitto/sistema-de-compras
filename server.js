// // server.js - VERSÃO FINAL PARA MySQL (Railway)
// const express = require('express');
// const cors = require('cors');
// const db = require('./db.js'); // Nosso conector para o MySQL do Railway
// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());

// // --- Rota de Teste ---
// app.get('/', (req, res) => {
//     res.send('API do Sistema de Compras com MySQL está funcionando!');
// });

// // --- API PARA USUÁRIOS (Login/Cadastro) ---
// app.post('/api/register', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         // ATENÇÃO: Em um projeto real, a senha deve ser criptografada (hashed)
//         await db.query('INSERT INTO usuarios (username, password_hash) VALUES (?, ?)', [username, password]);
//         res.status(201).json({ message: 'Usuário criado com sucesso!' });
//     } catch (e) {
//         // Código 'ER_DUP_ENTRY' é específico do MySQL para entradas duplicadas
//         if (e.code === 'ER_DUP_ENTRY') {
//             return res.status(400).json({ message: 'Este nome de usuário já existe.' });
//         }
//         res.status(500).json({ message: 'Erro ao criar usuário.' });
//     }
// });

// app.post('/api/login', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         // A sintaxe de query do mysql2 usa '?' para parâmetros
//         const [rows] = await db.query('SELECT * FROM usuarios WHERE username = ? AND password_hash = ?', [username, password]);
//         if (rows.length > 0) {
//             res.status(200).json({ message: 'Login bem-sucedido!' });
//         } else {
//             res.status(401).json({ message: 'Usuário ou senha inválidos.' });
//         }
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// // --- API PARA FORNECEDORES ---
// app.get('/api/fornecedores', async (req, res) => {
//     try {
//         const [rows] = await db.query('SELECT * FROM fornecedores ORDER BY nome ASC');
//         res.json(rows);
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// app.post('/api/fornecedores', async (req, res) => {
//     const { filial, nome, cnpj, pagamento, acordo, inicioVigencia, finalVigencia, acao } = req.body;
//     try {
//         const [result] = await db.query(
//             'INSERT INTO fornecedores (filial, nome, cnpj, pagamento, acordo, inicio_vigencia, final_vigencia, acao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
//             [filial, nome, cnpj, pagamento, acordo, inicioVigencia || null, finalVigencia || null, acao]
//         );
//         res.status(201).json({ id: result.insertId });
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });
// // 
// app.delete('/api/fornecedores/:id', async (req, res) => {
//     try {
//         await db.query('DELETE FROM fornecedores WHERE id = ?', [req.params.id]);
//         res.sendStatus(204); // No Content
//     } catch(err) { res.status(500).json({ error: err.message }); }
// });


// // --- API PARA REQUISIÇÕES ---
// app.get('/api/requisicoes/:status', async(req, res) => {
//     const { status } = req.params;
//     try {
//         const [rows] = await db.query('SELECT * FROM requisicoes WHERE status = ? ORDER BY id DESC', [status]);
//         res.json(rows);
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// app.post('/api/requisicoes', async (req, res) => {
//     const { tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status } = req.body;
//     try {
//         const [result] = await db.query(
//             'INSERT INTO requisicoes (tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
//             [tipo, data, requisicao, fornecedor, filial, nf, oc, observacao, status]
//         );
//         res.status(201).json({ id: result.insertId });
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// app.put('/api/requisicoes/:id/status', async (req, res) => {
//     const { id } = req.params;
//     const { status } = req.body;
//     try {
//         await db.query('UPDATE requisicoes SET status = ? WHERE id = ?', [status, id]);
//         res.status(200).json({ message: 'Status atualizado' });
//     } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // --- API PARA DASHBOARD ---
// app.get('/api/dashboard-stats', async (req, res) => {
//     try {
//         const [pagamentosPendentes] = await db.query("SELECT COUNT(*) as count FROM requisicoes WHERE status = 'pagamento_pendente'");
//         const [pagamentosRealizados] = await db.query("SELECT COUNT(*) as count FROM requisicoes WHERE status = 'pago'");
//         const [contratosRealizados] = await db.query("SELECT COUNT(*) as count FROM contratos WHERE status = 'Ativo'"); 
//         const [contratosPendentes] = await db.query("SELECT COUNT(*) as count FROM contratos WHERE status = 'Pendente'");

//         res.json({
//             pagamentos_pendentes: pagamentosPendentes[0].count,
//             pagamentos_realizados: pagamentosRealizados[0].count,
//             contratos_realizados: contratosRealizados[0].count,
//             contratos_pendentes: contratosPendentes[0].count,
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Servidor escutando em 0.0.0.0:${PORT}`);
// });