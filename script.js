document.addEventListener('DOMContentLoaded', () => {
    // A URL PÚBLICA do seu back-end que está rodando no Render
    const API_URL = 'https://sistema-de-compras-production.up.railway.app/api';

    // Função para mostrar notificações
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
                setTimeout(() => window.location.href = 'login.html', 1000);
            } catch (error) {
                showNotification(error.message || 'Erro no cadastro.', 'error');
            }
        });
    }
    
    // Botão de Logout
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            showNotification('Sessão encerrada.', 'success');
            setTimeout(() => window.location.href = 'index.html', 1000);
        });
    }

    // Funcionalidades da barra lateral
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

    // --- PÁGINA DASHBOARD ---
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

    // --- PÁGINA DE FORNECEDORES ---
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

                row.innerHTML = `
                    <td><button class="edit-btn" data-id="${f.id}"><i class="fas fa-edit"></i></button></td>
                    <td>${f.filial}</td>
                    <td>${f.nome}</td>
                    <td>${f.cnpj}</td>
                    <td>${f.pagamento}</td>
                    <td>${f.acordo || ''}</td>
                    <td>${inicioVigencia}</td>
                    <td>${finalVigencia}</td>
                    <td>${f.acao}</td>
                    <td><button class="delete-btn" data-id="${f.id}"><i class="fas fa-trash-alt"></i></button></td>
                `;
            });
        };

        addFornecedorBtn.addEventListener('click', async () => {
            const fornecedorData = {
                filial: document.getElementById('fornecedor-filial').value,
                nome: document.getElementById('fornecedor-nome').value,
                cnpj: document.getElementById('fornecedor-cnpj').value,
                pagamento: document.getElementById('fornecedor-pagamento').value,
                acordo: document.getElementById('fornecedor-acordo').value,
                inicioVigencia: document.getElementById('fornecedor-inicio-vigencia').value,
                finalVigencia: document.getElementById('fornecedor-final-vigencia').value,
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

        fornecedoresTableBody.addEventListener('click', async (event) => {
            const target = event.target.closest('button.delete-btn');
            if (target) {
                const id = target.dataset.id;
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

    // --- PÁGINA DE REQUISIÇÃO ---
    async function setupRequisicao() {
        const requisitionTableBody = document.getElementById('requisition-table-body');
        const addRequisitionButton = document.getElementById('add-requisition-button');
        if (!requisitionTableBody) return;

        const renderRequisitionsTable = async () => {
            const requisicoes = await fetchData('requisicoes/pendentes');
            requisitionTableBody.innerHTML = '';
            requisicoes.forEach(req => {
                const row = requisitionTableBody.insertRow();
                const data = req.data ? new Date(req.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                row.innerHTML = `
                    <td><button class="edit-btn" data-id="${req.id}">✏️</button></td>
                    <td>${req.tipo}</td>
                    <td>${data}</td>
                    <td>${req.requisicao}</td>
                    <td>${req.fornecedor}</td>
                    <td>${req.nf}</td>
                    <td>${req.oc}</td>
                    <td>${req.observacao}</td>
                    <td>
                        <span class="status-icon approve-btn" data-id="${req.id}">✔️</span>
                        <span class="status-icon reject-btn" data-id="${req.id}">✖️</span>
                    </td>
                `;
            });
        };

        // ... (código para mostrar/esconder o formulário de nova requisição)

        if(addRequisitionButton) {
            addRequisitionButton.addEventListener('click', async () => {
                const requisicaoData = {
                    tipo: document.getElementById('input-tipo').value,
                    data: document.getElementById('input-data').value,
                    requisicao: document.getElementById('input-requisicao').value,
                    fornecedor: document.getElementById('input-fornecedor').value,
                    nf: document.getElementById('input-nf').value,
                    oc: document.getElementById('input-oc').value,
                    filial: 'SAO', // Exemplo, precisa ajustar para pegar filial selecionada
                    observacao: '',
                    status: 'pendente'
                };
                try {
                    await fetch(`${API_URL}/requisicoes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requisicaoData)
                    });
                    showNotification('Requisição adicionada!', 'success');
                    renderRequisitionsTable();
                } catch(err) {
                    showNotification('Falha ao adicionar requisição.', 'error');
                }
            });
        }
        
        requisitionTableBody.addEventListener('click', async (event) => {
            const target = event.target;
            const id = target.dataset.id;
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
    
    // --- PÁGINA FISCAL ---
    async function setupFiscal() {
        const xmlTableBody = document.getElementById('xml-table-body');
        const portalTableBody = document.getElementById('portal-table-body');
        if(!xmlTableBody || !portalTableBody) return;
        
        const renderFiscalTables = async () => {
            const requisicoes = await fetchData('requisicoes/aprovadas');
            xmlTableBody.innerHTML = '';
            portalTableBody.innerHTML = '';
            requisicoes.forEach(req => {
                const row = document.createElement('tr');
                const data = req.data ? new Date(req.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                row.innerHTML = `
                    <td>${req.tipo}</td>
                    <td>${data}</td>
                    <td>${req.requisicao}</td>
                    <td>${req.fornecedor}</td>
                    <td>${req.nf}</td>
                    <td>${req.oc}</td>
                    <td><button class="approve-fiscal-btn" data-id="${req.id}">✔️</button></td>
                `;
                // Lógica para separar em XML ou PORTAL precisa ser definida no back-end ou front-end
                xmlTableBody.appendChild(row); 
            });
        };

        document.body.addEventListener('click', async (event) => {
            if(event.target.classList.contains('approve-fiscal-btn')) {
                const id = event.target.dataset.id;
                try {
                    await fetch(`${API_URL}/requisicoes/${id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'pagamento_pendente' })
                    });
                    showNotification('Enviado para Pagamentos!', 'success');
                    renderFiscalTables();
                } catch (err) {
                    showNotification('Falha ao enviar para pagamentos.', 'error');
                }
            }
        });
        
        renderFiscalTables();
    }
    
    // --- PÁGINA DE PAGAMENTOS ---
    async function setupPagamentos() {
        const pagamentosTableBody = document.getElementById('pagamentos-table-body');
        if(!pagamentosTableBody) return;

        const renderPagamentosTable = async () => {
            const requisicoes = await fetchData('requisicoes/pagamento-pendente');
            pagamentosTableBody.innerHTML = '';
            requisicoes.forEach(req => {
                const row = pagamentosTableBody.insertRow();
                const data = req.data ? new Date(req.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                row.innerHTML = `
                    <td>${req.tipo}</td>
                    <td>${data}</td>
                    <td>${req.requisicao}</td>
                    <td>${req.fornecedor}</td>
                    <td>${req.filial}</td>
                    <td>Pendente</td>
                    <td><button class="realizado-btn" data-id="${req.id}">Realizado</button></td>
                `;
            });
        };
        
        pagamentosTableBody.addEventListener('click', async (event) => {
            if (event.target.classList.contains('realizado-btn')) {
                const id = event.target.dataset.id;
                try {
                    await fetch(`${API_URL}/requisicoes/${id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'pago' })
                    });
                    showNotification('Pagamento realizado!', 'success');
                    renderPagamentosTable();
                } catch(err) {
                    showNotification('Falha ao registrar pagamento.', 'error');
                }
            }
        });

        renderPagamentosTable();
    }
    
    // --- PÁGINA DE CONTRATOS ---
    async function setupContratos() {
        // Esta função já foi implementada como exemplo em respostas anteriores
        // Se precisar, posso inseri-la aqui novamente
    }
    
    // --- LÓGICA DE INICIALIZAÇÃO ---
    const page = window.location.pathname.split('/').pop();

    if (page.includes('Dashboard.html')) setupDashboard();
    else if (page.includes('fornecedores.html')) setupFornecedores();
    else if (page.includes('requisicao.html')) setupRequisicao();
    else if (page.includes('fiscal.html')) setupFiscal();
    else if (page.includes('pagamentos.html')) setupPagamentos();
    else if (page.includes('contratos.html')) setupContratos();
});