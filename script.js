document.addEventListener('DOMContentLoaded', () => {
    // Na Vercel, a API e o site rodam no mesmo domínio.
    const API_URL = '/api';

    // --- FUNÇÃO DE NOTIFICAÇÃO ---
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

    // --- FUNÇÃO GLOBAL DE FETCH ---
    async function fetchData(endpoint, params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const fullEndpoint = `${endpoint}${queryParams ? '?' + queryParams : ''}`;

        try {
            const response = await fetch(`${API_URL}/${fullEndpoint}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Falha ao buscar dados de ${endpoint}:`, error);
            showNotification(error.message, 'error');
            return [];
        }
    }

    // --- LÓGICA DE PERSISTÊNCIA DE FILIAL ---
    function loadSelectedFilialFromStorage() {
        const selectedFilial = localStorage.getItem('selectedFilial');
        const filialText = document.getElementById('filial-display-name');
        
        if (filialText && selectedFilial) {
            filialText.textContent = selectedFilial.toUpperCase();
        }
    }

    // --- LOGIN E CADASTRO ---
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

    // --- LÓGICA GLOBAL ---
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

    // --- DASHBOARD ---
    async function setupDashboard() {
        try {
            const stats = await fetchData('dashboard-stats');
            document.getElementById('pagamentos-pendentes').textContent = stats.pagamentos_pendentes || 0;
            document.getElementById('pagamentos-realizados').textContent = stats.pagamentos_realizados || 0;
            document.getElementById('contratos-realizados').textContent = stats.contratos_realizados || 0;
            document.getElementById('contratos-pendentes').textContent = stats.contratos_pendentes || 0;
        } catch(err) {
            console.error("Falha ao carregar estatísticas do dashboard", err);
        }

        const filialBtn = document.getElementById('open-filial-modal');
        const filialModal = document.getElementById('filial-modal');
        const closeBtn = document.querySelector('.modal .close-btn');
        const filialList = document.getElementById('filial-list');
        const filialText = document.getElementById('filial-display-name');

        if (filialBtn && filialModal && filialList) {
            const filiaisDoBanco = await fetchData('filiais');
            filialList.innerHTML = '';

            const todasLi = document.createElement('li');
            todasLi.dataset.value = 'todas';
            todasLi.textContent = 'Todas';
            filialList.appendChild(todasLi);

            filiaisDoBanco.forEach(filial => {
                const li = document.createElement('li');
                li.dataset.value = filial.nome;
                li.textContent = filial.nome;
                filialList.appendChild(li);
            });

            filialBtn.addEventListener('click', () => filialModal.style.display = 'block');
            if (closeBtn) closeBtn.addEventListener('click', () => filialModal.style.display = 'none');
            window.addEventListener('click', (event) => {
                if (event.target === filialModal) filialModal.style.display = 'none';
            });

            filialList.addEventListener('click', (event) => {
                if (event.target.tagName === 'LI') {
                    const selectedFilial = event.target.dataset.value;
                    localStorage.setItem('selectedFilial', selectedFilial);
                    if(filialText) filialText.textContent = event.target.textContent;
                    filialModal.style.display = 'none';
                    // Recarrega a página para aplicar o filtro imediatamente
                    window.location.reload(); 
                }
            });
        }
    }

async function setupFornecedores() {
    const fornecedoresTableBody = document.getElementById('fornecedores-table-body');
    const addFornecedorBtn = document.getElementById('toggle-fornecedor-form');
    const fornecedorFormSection = document.getElementById('new-fornecedor-section');
    const fornecedorForm = document.getElementById('fornecedor-form');
    const mainHeader = document.querySelector('.main-header');

    const renderFornecedoresTable = async () => {
        const selectedFilial = localStorage.getItem('selectedFilial');
        const params = selectedFilial && selectedFilial !== 'todas' ? { filial: selectedFilial } : {};
        const fornecedores = await fetchData('fornecedores', params);
        
        fornecedoresTableBody.innerHTML = '';
        
        if (fornecedores.length === 0) {
            const emptyRow = fornecedoresTableBody.insertRow();
            emptyRow.innerHTML = `<td colspan="10" class="empty-message">Nenhum fornecedor encontrado para a filial selecionada.</td>`;
            return;
        }

        fornecedores.forEach(f => {
            const row = fornecedoresTableBody.insertRow();
            const inicioVigencia = f.inicio_vigencia ? new Date(f.inicio_vigencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
            const finalVigencia = f.final_vigencia ? new Date(f.final_vigencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
            row.dataset.id = f.id;
            row.innerHTML = `
                <td><button class="edit-btn" data-id="${f.id}"><i class="fas fa-edit"></i></button></td>
                <td>${f.filial || ''}</td>
                <td>${f.nome || ''}</td>
                <td>${f.cnpj || ''}</td>
                <td>${f.pagamento || ''}</td>
                <td>${f.acordo || ''}</td>
                <td>${inicioVigencia}</td>
                <td>${finalVigencia}</td>
                <td>${f.acao || ''}</td>
                <td><button class="delete-btn" data-id="${f.id}"><i class="fas fa-trash-alt"></i></button></td>
            `;
        });
    };
    
    // Variável para armazenar o ID do fornecedor em edição
    let editingFornecedorId = null;

    if (addFornecedorBtn && fornecedorFormSection) {
        addFornecedorBtn.addEventListener('click', () => {
            const isFormVisible = fornecedorFormSection.style.display === 'block';
            fornecedorFormSection.style.display = isFormVisible ? 'none' : 'block';
            
            if (isFormVisible) {
                mainHeader.classList.remove('form-open');
                fornecedorForm.reset();
            } else {
                mainHeader.classList.add('form-open');
            }
        });
    }

    if (fornecedorForm) {
        fornecedorForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(fornecedorForm);
            const fornecedorData = Object.fromEntries(formData.entries());
            
            const filialSelecionada = localStorage.getItem('selectedFilial');
            if (filialSelecionada) {
                fornecedorData.filial = filialSelecionada;
            }

            try {
                let method = 'POST';
                let endpoint = `${API_URL}/fornecedores`;

                if (editingFornecedorId) {
                    method = 'PUT';
                    endpoint = `${API_URL}/fornecedores/${editingFornecedorId}`;
                }

                await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fornecedorData)
                });
                showNotification(`Fornecedor ${editingFornecedorId ? 'atualizado' : 'adicionado'}!`, 'success');
                fornecedorForm.reset();
                fornecedorFormSection.style.display = 'none';
                renderFornecedoresTable();
                editingFornecedorId = null; // Reseta o ID de edição
            } catch (error) {
                showNotification('Falha ao salvar fornecedor.', 'error');
            }
        });
    }
    
    fornecedoresTableBody.addEventListener('click', async (event) => {
        const deleteTarget = event.target.closest('button.delete-btn');
        if (deleteTarget) {
            const id = deleteTarget.dataset.id;
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

    fornecedoresTableBody.addEventListener('click', async (event) => {
        const editTarget = event.target.closest('button.edit-btn');
        if (editTarget) {
            const id = editTarget.dataset.id;
            showNotification(`Editando fornecedor ID: ${id}`, 'info');
            
            // Lógica para preencher o formulário
            const row = editTarget.closest('tr');
            document.getElementById('fornecedor-filial').value = row.cells[1].textContent;
            document.getElementById('fornecedor-nome').value = row.cells[2].textContent;
            document.getElementById('fornecedor-cnpj').value = row.cells[3].textContent;
            document.getElementById('fornecedor-pagamento').value = row.cells[4].textContent;
            document.getElementById('fornecedor-acordo').value = row.cells[5].textContent;
            
            // Converte a data do formato dd/mm/yyyy para yyyy-mm-dd
            const inicioVigencia = row.cells[6].textContent;
            if (inicioVigencia) {
                const parts = inicioVigencia.split('/');
                document.getElementById('fornecedor-inicio-vigencia').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
                document.getElementById('fornecedor-inicio-vigencia').value = '';
            }

            const finalVigencia = row.cells[7].textContent;
            if (finalVigencia) {
                const parts = finalVigencia.split('/');
                document.getElementById('fornecedor-final-vigencia').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
                document.getElementById('fornecedor-final-vigencia').value = '';
            }
            
            document.getElementById('fornecedor-acao').value = row.cells[8].textContent;
            
            // Armazena o ID para a submissão do formulário
            editingFornecedorId = id;
            
            // Mostra o formulário de edição
            fornecedorFormSection.style.display = 'block';
            mainHeader.classList.add('form-open');
        }
    });
    
    renderFornecedoresTable();
}

    // --- REQUISIÇÕES ---
    async function setupRequisicao() {
        const requisitionTableBody = document.getElementById('requisition-table-body');
        const addRequisicaoBtn = document.getElementById('toggle-requisition-form');
        const requisicaoFormSection = document.getElementById('new-requisicao-section');
        const requisicaoForm = document.getElementById('requisicao-form');
        const mainHeader = document.querySelector('.main-header');

        const renderRequisitionsTable = async () => {
            const selectedFilial = localStorage.getItem('selectedFilial');
            const params = selectedFilial && selectedFilial !== 'todas' ? { filial: selectedFilial } : {};
            const requisicoes = await fetchData('requisicoes/pendentes', params);
            
            requisitionTableBody.innerHTML = '';
            
            if (requisicoes.length === 0) {
                const emptyRow = requisitionTableBody.insertRow();
                emptyRow.innerHTML = `<td colspan="10" class="empty-message">Nenhuma requisição encontrada para a filial selecionada.</td>`;
                return;
            }

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
                    <td>${req.filial || ''}</td>
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

        if (addRequisicaoBtn && requisicaoFormSection) {
            addRequisicaoBtn.addEventListener('click', () => {
                const isFormVisible = requisicaoFormSection.style.display === 'block';
                requisicaoFormSection.style.display = isFormVisible ? 'none' : 'block';
                
                if (isFormVisible) {
                    mainHeader.classList.remove('form-open');
                    requisicaoForm.reset();
                } else {
                    mainHeader.classList.add('form-open');
                }
            });
        }
        
        if (requisicaoForm) {
            requisicaoForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const formData = new FormData(requisicaoForm);
                const requisicaoData = Object.fromEntries(formData.entries());

                const filialSelecionada = localStorage.getItem('selectedFilial');
                if (filialSelecionada) {
                    requisicaoData.filial = filialSelecionada;
                }

                try {
                    await fetch(`${API_URL}/requisicoes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requisicaoData)
                    });
                    showNotification('Requisição adicionada!', 'success');
                    requisicaoForm.reset();
                    requisicaoFormSection.style.display = 'none';
                    mainHeader.classList.remove('form-open');
                    renderRequisitionsTable();
                } catch (error) {
                    showNotification('Falha ao adicionar requisição.', 'error');
                }
            });
        }

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

    // --- CONTRATOS ---
    async function setupContratos() {
        const contratosTableBody = document.getElementById('contratos-table-body');
        const addContratoBtn = document.getElementById('toggle-contrato-form');
        const contratoFormSection = document.getElementById('new-contrato-section');
        const contratoForm = document.getElementById('contrato-form');
        const mainHeader = document.querySelector('.main-header');

        const renderContratosTable = async () => {
            const selectedFilial = localStorage.getItem('selectedFilial');
            const params = selectedFilial && selectedFilial !== 'todas' ? { filial: selectedFilial } : {};
            const contratos = await fetchData('contratos', params);
            
            contratosTableBody.innerHTML = '';

            if (contratos.length === 0) {
                const emptyRow = contratosTableBody.insertRow();
                emptyRow.innerHTML = `<td colspan="7" class="empty-message">Nenhum contrato encontrado para a filial selecionada.</td>`;
                return;
            }

            contratos.forEach(contrato => {
                const row = contratosTableBody.insertRow();
                row.dataset.id = contrato.id;
                const inicio = contrato.inicio ? new Date(contrato.inicio).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                const fim = contrato.fim ? new Date(contrato.fim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                row.innerHTML = `
                    <td>${contrato.numero || ''}</td>
                    <td>${contrato.fornecedor || ''}</td>
                    <td>${inicio}</td>
                    <td>${fim}</td>
                    <td>${contrato.valor || ''}</td>
                    <td>${contrato.status || ''}</td>
                    <td>
                        <button class="edit-btn">✏️</button>
                        <button class="delete-btn">🗑️</button>
                    </td>
                `;
            });
        };

        if (addContratoBtn && contratoFormSection) {
            addContratoBtn.addEventListener('click', () => {
                const isFormVisible = contratoFormSection.style.display === 'block';
                contratoFormSection.style.display = isFormVisible ? 'none' : 'block';
                
                if (isFormVisible) {
                    mainHeader.classList.remove('form-open');
                    contratoForm.reset();
                } else {
                    mainHeader.classList.add('form-open');
                }
            });
        }

        if (contratoForm) {
            contratoForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const formData = new FormData(contratoForm);
                const contratoData = Object.fromEntries(formData.entries());

                const filialSelecionada = localStorage.getItem('selectedFilial');
                if (filialSelecionada) {
                    contratoData.filial = filialSelecionada;
                }

                try {
                    await fetch(`${API_URL}/contratos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(contratoData)
                    });
                    showNotification('Contrato adicionado!', 'success');
                    contratoForm.reset();
                    contratoFormSection.style.display = 'none';
                    mainHeader.classList.remove('form-open');
                    renderContratosTable();
                } catch (error) {
                    showNotification('Falha ao adicionar contrato.', 'error');
                }
            });
        }

        contratosTableBody.addEventListener('click', async (event) => {
            const target = event.target;
            const row = target.closest('tr');
            const id = row?.dataset.id;

            if (target.classList.contains('delete-btn')) {
                if (confirm('Tem certeza que deseja excluir este contrato?')) {
                    try {
                        await fetch(`${API_URL}/contratos/${id}`, {
                            method: 'DELETE'
                        });
                        showNotification('Contrato excluído!', 'success');
                        renderContratosTable();
                    } catch (err) {
                        showNotification('Falha ao excluir contrato.', 'error');
                    }
                }
            }
        });

        renderContratosTable();
    }
    
    // --- ROTEADOR ---
    const path = window.location.pathname;
    const page = path.split("/").pop();

    loadSelectedFilialFromStorage();

    if (page === 'Dashboard.html' || page === '' || page === 'index.html') {
        if (document.body.querySelector('.status-cards')) {
            setupDashboard();
        }
    } else if (page === 'fornecedores.html') {
        setupFornecedores();
    } else if (page === 'requisicao.html') {
        setupRequisicao();
    } else if (page === 'contratos.html') {
        setupContratos();
    }
});
