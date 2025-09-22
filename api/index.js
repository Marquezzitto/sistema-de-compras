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
            [tipo || null, data || null, requisicao || null, fornecedor || null, filial || null, nf || null, oc || null, observacao || null, status || 'pendente']
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
        } else if (acaoForção do Fornecedor`) para `acao` (`Ação`).
- `col-fornecedor-excluir` para o botão de exclusão (`Excluir`).

A lógica é que o JavaScript renderiza as colunas de dados (`<td>`) na mesma ordem que os cabeçalhos (`<th>`). Se houver uma célula faltando ou fora de ordem, toda a tabela se desalinha.

Com base nas suas imagens, a sua tabela tem **9 colunas de dados** e **10 cabeçalhos**.

### O que causou o desalinhamento

A imagem da sua tabela mostra que, em `requisicao.html`, você tem estas colunas: `Editar`, `Tipo`, `Data`, `Requisição`, `Fornecedor`, `NF`, `OC`, `Observação`, e `Status`. Isso dá um total de 9 colunas.

Porém, o JavaScript que renderiza as colunas `<td>` parece estar com uma contagem diferente, e os ícones de status estão fora da tabela.

### Como corrigir

Vamos ajustar o código HTML da sua tabela para ter a estrutura correta, e a lógica de renderização no JavaScript para que ela se encaixe perfeitamente.

---

### **Arquivo `requisicao.html` (Corrigido)**

Substitua toda a sua seção de tabela (`<section class="table-section">`) por este código. Eu garanti que a tabela tenha exatamente 9 colunas de cabeçalho.

```html
<section class="table-section">
    <h3>Requisições Pendentes</h3>
    <table id="requisition-table">
        <thead>
            <tr>
                <th class="col-editar">Editar</th>
                <th class="col-tipo">Tipo</th>
                <th class="col-data">Data</th>
                <th class="col-requisicao">Requisição</th>
                <th class="col-fornecedor">Fornecedor</th>
                <th class="col-nf">NF</th>
                <th class="col-oc">OC</th>
                <th class="col-observacao">Observação</th>
                <th class="col-status">Status</th>
            </tr>
        </thead>
        <tbody id="requisition-table-body">
            
        </tbody>
    </table>
</section>
