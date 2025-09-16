document.addEventListener('DOMContentLoaded', () => {
    // A URL PÚBLICA do seu back-end que está rodando no Render
    const API_URL = 'https://api-sistema-de-compras.onrender.com/api';

    // Função para mostrar notificações (continua a mesma)
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

    // --- LÓGICA DE LOGIN E CADASTRO (COM API) ---
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
            setTimeout(() => window.location.href = 'login.html', 1000);
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

    // --- PÁGINA DE FORNECEDORES ---
    async function setupFornecedores() {
        const fornecedoresTableBody = document.getElementById('fornecedores-table-body');
        const addFornecedorBtn = document.getElementById('add-fornecedor-button');
        const fornecedorForm = document.getElementById('fornecedor-form');
        if(!fornecedoresTableBody) return;

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
        
        // Adicionar aqui a lógica de delete se precisar
        
        renderFornecedoresTable();
    }
    
    // --- LÓGICA DE INICIALIZAÇÃO ---
    const page = window.location.pathname.split('/').pop();

    if (page.includes('fornecedores.html')) {
        setupFornecedores();
    }
    // Adicione outros 'else if' para as demais páginas que você implementar
});