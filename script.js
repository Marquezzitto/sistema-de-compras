document.addEventListener('DOMContentLoaded', () => {
    // Na Vercel, a API e o site rodam no mesmo domínio.
    // Usamos um caminho relativo que funciona automaticamente.
    const API_URL = '/api';

    // Sua função de notificação (continua a mesma)
    const showNotification = (message, type) => {
        const container = document.getElementById('notification-container');
        if (!container) return;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);
        setTimeout(() => { notification.classList.add('show'); }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => { if (container.contains(notification)) container.removeChild(notification); }, 500);
        }, 3000);
    };

    // --- LÓGICA DE LOGIN E CADASTRO ---
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', async () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                
                localStorage.setItem('isLoggedIn', 'true');
                showNotification('Login bem-sucedido!', 'success');
                setTimeout(() => window.location.href = 'Dashboard.html', 1000);
            } catch (error) {
                showNotification(error.message || 'Erro ao fazer login.', 'error');
            }
        });
    }

    const registerButton = document.getElementById('register-button');
    if (registerButton) {
        registerButton.addEventListener('click', async () => {
            const newUsername = document.getElementById('new-username').value;
            const newPassword = document.getElementById('new-password').value;
            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: newUsername, password: newPassword })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                showNotification('Cadastro realizado com sucesso!', 'success');
                setTimeout(() => window.location.href = 'index.html', 1000);
            } catch (error) {
                showNotification(error.message || 'Erro no cadastro.', 'error');
            }
        });
    }
    
    // --- LÓGICA GLOBAL (PÁGINAS INTERNAS) ---
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            showNotification('Sessão encerrada.', 'success');
            setTimeout(() => window.location.href = 'index.html', 1000);
        });
    }
    
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
    }

    // Função genérica para buscar dados da API
    async function fetchData(endpoint) {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`);
            if (!response.ok) throw new Error(`Erro ao buscar dados de ${endpoint}`);
            return await response.json();
        } catch (error) {
            console.error(error);
            showNotification(error.message, 'error');
            return [];
        }
    }

    // --- FUNÇÕES DE SETUP PARA CADA PÁGINA ---
    
    async function setupDashboard() {
       try {
            const stats = await fetchData('dashboard-stats');
            document.getElementById('pagamentos-pendentes').textContent = stats.pagamentos_pendentes || 0;
            document.getElementById('pagamentos-realizados').textContent = stats.pagamentos_realizados || 0;
            document.getElementById('contratos-realizados').textContent = stats.contratos_realizados || 0;
            document.getElementById('contratos-pendentes').textContent = stats.contratos_pendentes || 0;
        } catch(err) {
            console.error("Falha ao carregar estatísticas do dashboard");
        }
    }

    async function setupFornecedores() {
        const fornecedoresTableBody = document.getElementById('fornecedores-table-body');
        const addFornecedorBtn = document.getElementById('add-fornecedor-button');
        const fornecedorForm = document.getElementById('fornecedor-form');
        if (!fornecedoresTableBody) return;

        const renderFornecedoresTable = async () => {
            const fornecedores = await fetchData('fornecedores');
            fornecedoresTableBody.innerHTML = '';
            fornecedores.forEach(f => {
                const row = fornecedoresTableBody.insertRow();
                const inicioVigencia = f.inicio_vigencia ? new Date(f.inicio_vigencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                const finalVigencia = f.final_vigencia ? new Date(f.final_vigencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                row.dataset.id = f.id; // Usando o ID do banco

                row.innerHTML = `
                    <td><button class="edit-btn"><i class="fas fa-edit"></i></button></td>
                    <td>${f.filial || ''}</td>
                    <td>${f.nome || ''}</td>
                    <td>${f.cnpj || ''}</td>
                    <td>${f.pagamento || ''}</td>
                    <td>${f.acordo || ''}</td>
                    <td>${inicioVigencia}</td>
                    <td>${finalVigencia}</td>
                    <td>${f.acao || ''}</td>
                    <td><button class="delete-btn"><i class="fas fa-trash-alt"></i></button></td>
                `;
            });
        };

        if (addFornecedorBtn) {
            addFornecedorBtn.addEventListener('click', async () => {
                const fornecedorData = {
                    filial: document.getElementById('fornecedor-filial').value,
                    nome: document.getElementById('fornecedor-nome').value,
                    cnpj: document.getElementById('fornecedor-cnpj').value,
                    pagamento: document.getElementById('fornecedor-pagamento').value,
                    acordo: document.getElementById('fornecedor-acordo').value,
                    inicioVigencia: document.getElementById('fornecedor-inicio-vigencia').value || null,
                    finalVigencia: document.getElementById('fornecedor-final-vigencia').value || null,
                    acao: document.getElementById('fornecedor-acao').value
                };

                try {
                    await fetch(`${API_URL}/fornecedores`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(fornecedorData)
                    });
                    showNotification('Fornecedor adicionado!', 'success');
                    fornecedorForm.reset();
                    renderFornecedoresTable();
                } catch (error) {
                    showNotification('Falha ao adicionar fornecedor.', 'error');
                }
            });
        }
        
        fornecedoresTableBody.addEventListener('click', async (event) => {
            const target = event.target.closest('button.delete-btn');
            if (target) {
                const row = target.closest('tr');
                const id = row.dataset.id;
                if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
                    try {
                        await fetch(`${API_URL}/fornecedores/${id}`, { method: 'DELETE' });
                        showNotification('Fornecedor excluído com sucesso!', 'success');
                        renderFornecedoresTable();
                    } catch (error) {
                        showNotification('Falha ao excluir o fornecedor.', 'error');
                    }
                }
            }
        });
        
        renderFornecedoresTable();
    }

    async function setupRequisicao() {
        const requisitionTableBody = document.getElementById('requisition-table-body');
        if (!requisitionTableBody) return;

        const renderRequisitionsTable = async () => {
            const requisicoes = await fetchData('requisicoes/pendentes');
            requisitionTableBody.innerHTML = '';
            requisicoes.forEach(req => {
                const row = requisitionTableBody.insertRow();
                row.dataset.id = req.id;
                const data = req.data ? new Date(req.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                row.innerHTML = `
                    <td><button class="edit-btn">✏️</button></td>
                    <td>${req.tipo || ''}</td>
                    <td>${data}</td>
                    <td>${req.requisicao || ''}</td>
                    <td>${req.fornecedor || ''}</td>
                    <td>${req.nf || ''}</td>
                    <td>${req.oc || ''}</td>
                    <td>${req.observacao || ''}</td>
                    <td>
                        <span class="status-icon approve-btn" style="cursor:pointer;">✔️</span>
                        <span class="status-icon reject-btn" style="cursor:pointer;">✖️</span>
                    </td>
                `;
            });
        };

        requisitionTableBody.addEventListener('click', async (event) => {
            const target = event.target;
            const id = target.closest('tr')?.dataset.id;
            if(!id) return;

            let novoStatus = '';
            if(target.classList.contains('approve-btn')) novoStatus = 'aprovado';
            if(target.classList.contains('reject-btn')) novoStatus = 'rejeitado';
            
            if(novoStatus) {
                try {
                    await fetch(`${API_URL}/requisicoes/${id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: novoStatus })
                    });
                    showNotification(`Requisição ${novoStatus}!`, 'success');
                    renderRequisitionsTable();
                } catch(err) {
                    showNotification('Falha ao atualizar status.', 'error');
                }
            }
        });

        renderRequisitionsTable();
    }

    // --- ROTEADOR: DECIDE QUAL FUNÇÃO EXECUTAR ---
    // Esta é a nova lógica, mais robusta, para identificar a página
    const path = window.location.pathname;
    const page = path.split("/").pop(); // Pega a última parte da URL, ex: "Dashboard.html"

    // Roda a função correspondente à página atual
    if (page === 'Dashboard.html' || page === '') { // Adicionado '|| page === ""' para a página inicial
        setupDashboard();
    } else if (page === 'fornecedores.html') {
        setupFornecedores();
    } else if (page === 'requisicao.html') {
        setupRequisicao();
    }
    // ... adicione as outras páginas aqui (fiscal.html, pagamentos.html, etc.)
});
