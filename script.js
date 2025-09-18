alert("O arquivo script.js FOI CARREGADO!");
// script.js - VERSÃO FINAL E COMPLETA PARA VERCEL
document.addEventListener('DOMContentLoaded', () => {
    // Na Vercel, a API e o site rodam no mesmo domínio.
    // Não precisamos de uma URL completa, apenas o caminho relativo.
    const API_URL = '/api';

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
                setTimeout(() => window.location.href = 'index.html', 1000);
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

    // --- LÓGICA DE INICIALIZAÇÃO DAS PÁGINAS ---
    // (Cole aqui as suas funções setupDashboard, setupFornecedores, etc.,
    // pois elas já estão corretas para usar a função fetchData)

    // Exemplo para a página de fornecedores:
    async function setupFornecedores() {
        const fornecedoresTableBody = document.getElementById('fornecedores-table-body');
        if (!fornecedoresTableBody) return;
        
        const renderFornecedoresTable = async () => {
            const fornecedores = await fetchData('fornecedores');
            fornecedoresTableBody.innerHTML = '';
            fornecedores.forEach(f => {
                const row = fornecedoresTableBody.insertRow();
                // Adapte o conteúdo da linha para corresponder às suas colunas
                row.innerHTML = `
                    <td>${f.filial}</td>
                    <td>${f.nome}</td>
                    <td>${f.cnpj}</td>
                    <td><button class="delete-btn" data-id="${f.id}">Excluir</button></td>
                `;
            });
        };
        
        // ... (resto da sua lógica para adicionar, editar, deletar)

        renderFornecedoresTable();
    }
    
    const page = window.location.pathname.split('/').pop();

    if (page.includes('fornecedores.html')) {
        setupFornecedores();
    }
    // ... adicione as outras páginas aqui quando for implementá-las
});
