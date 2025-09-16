document.addEventListener('DOMContentLoaded', () => {
    // Funções auxiliares genéricas para localStorage e notificações
    const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
    const showNotification = (message, type) => {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.error("Elemento 'notification-container' não encontrado no DOM.");
            return;
        }
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 500);
        }, 3000);
    };
    // Funcionalidades de login e registro
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const users = getData('users');
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                localStorage.setItem('isLoggedIn', 'true');
                showNotification('Login bem-sucedido!', 'success');
                setTimeout(() => window.location.href = 'Dashboard.html', 1000);
            } else {
                showNotification('Usuário ou senha incorretos.', 'error');
            }
        });
    }
    const registerButton = document.getElementById('register-button');
    if (registerButton) {
        registerButton.addEventListener('click', () => {
            const newUsername = document.getElementById('new-username').value;
            const newPassword = document.getElementById('new-password').value;

            if (newUsername.length < 3 || newPassword.length < 3) {
                showNotification('Usuário e senha devem ter no mínimo 3 caracteres.', 'error');
                return;
            }
            const users = getData('users');
            if (users.find(u => u.username === newUsername)) {
                showNotification('Nome de usuário já existe. Escolha outro.', 'error');
                return;
            }

            users.push({ username: newUsername, password: newPassword });
            saveData('users', users);
            showNotification('Cadastro realizado com sucesso!', 'success');
            setTimeout(() => window.location.href = 'login.html', 1000);
        });
    }
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            showNotification('Sessão encerrada.', 'success');
            setTimeout(() => window.location.href = 'login.html', 1000);
        });
    }
    // Funcionalidades da barra lateral
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
        document.body.addEventListener('click', (event) => {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            if (sidebar.classList.contains('active') && !isClickInsideSidebar && !isClickOnToggle) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('open');
            }
        });
    }
    const highlightCurrentPage = () => {
        const currentPath = window.location.pathname.split('/').pop();
        const links = document.querySelectorAll('.sidebar ul a');
        links.forEach(link => {
            const linkPath = link.href.split('/').pop();
            if (linkPath === currentPath) {
                link.classList.add('active-link');
            }
        });
    };
    highlightCurrentPage();
    // Funções específicas para cada página
    if (window.location.pathname.includes('Dashboard.html')) {
        setupDashboard();
    } else if (window.location.pathname.includes('fornecedores.html')) {
        setupFornecedores();
    } else if (window.location.pathname.includes('requisicao.html')) {
        setupRequisicao();
    } else if (window.location.pathname.includes('fiscal.html')) {
        setupFiscal();
    } else if (window.location.pathname.includes('pagamentos.html')) {
        setupPagamentos();
    } else if (window.location.pathname.includes('contratos.html')) {
        setupContratos();
    }
    function setupDashboard() {
        const filialBtn = document.getElementById('open-filial-modal');
        const filialModal = document.getElementById('filial-modal');
        const closeBtn = document.querySelector('.modal .close-btn');
        const filialList = document.querySelector('.filial-list'); // UL das filiais
        const filialText = document.getElementById('filial-display-name');

        const availableFiliais = [
            { name: 'Todas', value: 'todas' },
            { name: 'SAO', value: 'filial_a_sp' },
            { name: 'LDB', value: 'filial_b_lo' },
            { name: 'SJK', value: 'filial_b_sj' },
            { name: 'IGU', value: 'filial_b_ig' },
            { name: 'CCX', value: 'filial_b_cx' },
            { name: 'PTO', value: 'filial_c_pt' }
        ];
        const populateFilialList = () => {
            if (filialList) {
                filialList.innerHTML = '';
                availableFiliais.forEach(filial => {
                    const li = document.createElement('li');
                    li.dataset.value = filial.value;
                    li.textContent = filial.name;
                    filialList.appendChild(li);
                });
            }
        };
        populateFilialList();
        const updateDashboardCounts = (filial) => {
            const allRequisitions = getData('requisitions');
            const filteredRequisitions = filial && filial !== 'todas' ? allRequisitions.filter(req => req.filial === filial) : allRequisitions;
            const pagamentosPendentes = filteredRequisitions.filter(req => req.status === 'aprovado' && req.status_pagamento !== 'realizado').length;
            const pagamentosRealizados = filteredRequisitions.filter(req => req.status_pagamento === 'realizado').length;
            const contratosRealizados = filteredRequisitions.filter(req => req.tipo === 'Contrato' && req.status === 'aprovado').length;
            const contratosPendente = filteredRequisitions.filter(req => req.tipo === 'Contrato' && req.status === 'pendente').length;
            if (document.getElementById('pagamentos-pendentes-card')) document.getElementById('pagamentos-pendentes-card').textContent = `Pagamentos Pendentes: ${pagamentosPendentes}`;
            if (document.getElementById('pagamentos-realizados-card')) document.getElementById('pagamentos-realizados-card').textContent = `Pagamentos Realizados: ${pagamentosRealizados}`;
            if (document.getElementById('contratos-realizados-card')) document.getElementById('contratos-realizados-card').textContent = `Contratos Realizados: ${contratosRealizados}`;
            if (document.getElementById('contratos-pendentes-card')) document.getElementById('contratos-pendentes-card').textContent = `Contratos Pendentes: ${contratosPendente}`;
        };
        const savedFilial = localStorage.getItem('selectedFilial');
        if (savedFilial) {
            const displayFilial = availableFiliais.find(f => f.value === savedFilial);
            filialText.textContent = displayFilial ? displayFilial.name : 'Selecione a Filial';
            updateDashboardCounts(savedFilial);
        } else {
            filialText.textContent = 'Selecione a Filial';
            updateDashboardCounts('todas');
        }
        if (filialBtn) {
            filialBtn.addEventListener('click', () => filialModal.style.display = 'block');
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => filialModal.style.display = 'none');
        }
        if (filialList) {
            filialList.addEventListener('click', (event) => {
                if (event.target.tagName === 'LI') {
                    const selectedFilial = event.target.dataset.value;
                    localStorage.setItem('selectedFilial', selectedFilial);
                    filialText.textContent = event.target.textContent;
                    updateDashboardCounts(selectedFilial);
                    filialModal.style.display = 'none';
                }
            });
        }
        window.addEventListener('click', (event) => {
            if (event.target === filialModal) {
                filialModal.style.display = 'none';
            }
        });
    }
    function setupFornecedores() {
        const toggleFornecedorFormBtn = document.getElementById('toggle-fornecedor-form');
        const fornecedorFormSection = document.getElementById('new-fornecedor-section');
        const addFornecedorBtn = document.getElementById('add-fornecedor-button');
        const fornecedoresTableBody = document.querySelector('#fornecedores-table-body');
        const fornecedorForm = document.getElementById('fornecedor-form');
        
        let editingIndex = null; // Variável para rastrear o índice do item sendo editado
        const renderFornecedoresTable = () => {
            if (!fornecedoresTableBody) return;
            fornecedoresTableBody.innerHTML = '';
            const fornecedores = getData('fornecedores');
            if (fornecedores.length === 0) {
                const noDataRow = fornecedoresTableBody.insertRow();
                noDataRow.innerHTML = `<td colspan="10" style="text-align: center; padding: 20px;">Nenhum fornecedor cadastrado.</td>`;
                return;
            }
            fornecedores.forEach((fornecedor, index) => {
                const row = document.createElement('tr');
                row.dataset.index = index;
                row.innerHTML = `
                    <td><button class="edit-btn"><i class="fas fa-edit"></i></button></td>
                    <td>${fornecedor.filial}</td>
                    <td>${fornecedor.nome}</td>
                    <td>${fornecedor.cnpj}</td>
                    <td>${fornecedor.pagamento}</td>
                    <td>${fornecedor.acordo}</td>
                    <td>${fornecedor.inicioVigencia}</td>
                    <td>${fornecedor.finalVigencia}</td>
                    <td>${fornecedor.acao}</td>
                    <td><button class="delete-btn"><i class="fas fa-trash-alt"></i></button></td>
                `;
                fornecedoresTableBody.appendChild(row);
            });
        };
        const resetForm = () => {
            fornecedorForm.reset();
            addFornecedorBtn.textContent = 'Adicionar Fornecedor';
            editingIndex = null;
        };
        if (toggleFornecedorFormBtn && fornecedorFormSection) {
            toggleFornecedorFormBtn.addEventListener('click', () => {
                const isVisible = fornecedorFormSection.style.display === 'flex';
                fornecedorFormSection.style.display = isVisible ? 'none' : 'flex';
                toggleFornecedorFormBtn.innerHTML = isVisible ? '<i class="fas fa-plus"></i> Fornecedor' : '<i class="fas fa-times"></i> Fechar';
                if (!isVisible) {
                    resetForm();
                }
            });
        }
        if (addFornecedorBtn) {
            addFornecedorBtn.addEventListener('click', () => {
                const filial = document.getElementById('fornecedor-filial').value;
                const nome = document.getElementById('fornecedor-nome').value;
                const cnpj = document.getElementById('fornecedor-cnpj').value;
                const pagamento = document.getElementById('fornecedor-pagamento').value;
                const acordo = document.getElementById('fornecedor-acordo').value;
                const inicioVigencia = document.getElementById('fornecedor-inicio-vigencia').value;
                const finalVigencia = document.getElementById('fornecedor-final-vigencia').value;
                const acao = document.getElementById('fornecedor-acao').value;
                if (!filial || !nome || !cnpj || !pagamento || !acordo || !inicioVigencia || !finalVigencia || !acao) {
                    showNotification('Preencha todos os campos do fornecedor!', 'error');
                    return;
                }
                let fornecedores = getData('fornecedores');
                const newFornecedor = { filial, nome, cnpj, pagamento, acordo, inicioVigencia, finalVigencia, acao };
                if (editingIndex !== null) {
                    fornecedores[editingIndex] = newFornecedor;
                    showNotification('Fornecedor atualizado com sucesso!', 'success');
                } else {
                    fornecedores.push(newFornecedor);
                    showNotification('Fornecedor adicionado com sucesso!', 'success');
                }
                saveData('fornecedores', fornecedores);
                renderFornecedoresTable();
                resetForm();
                fornecedorFormSection.style.display = 'none';
                toggleFornecedorFormBtn.innerHTML = '<i class="fas fa-plus"></i> Fornecedor';
            });
        }
        if (fornecedoresTableBody) {
            fornecedoresTableBody.addEventListener('click', (event) => {
                const target = event.target.closest('button');
                if (!target) return;
                const row = target.closest('tr');
                const index = row.dataset.index;
                let fornecedores = getData('fornecedores');
                if (target.classList.contains('edit-btn')) {
                    const fornecedorToEdit = fornecedores[index];
                    document.getElementById('fornecedor-filial').value = fornecedorToEdit.filial;
                    document.getElementById('fornecedor-nome').value = fornecedorToEdit.nome;
                    document.getElementById('fornecedor-cnpj').value = fornecedorToEdit.cnpj;
                    document.getElementById('fornecedor-pagamento').value = fornecedorToEdit.pagamento;
                    document.getElementById('fornecedor-acordo').value = fornecedorToEdit.acordo;
                    document.getElementById('fornecedor-inicio-vigencia').value = fornecedorToEdit.inicioVigencia;
                    document.getElementById('fornecedor-final-vigencia').value = fornecedorToEdit.finalVigencia;
                    document.getElementById('fornecedor-acao').value = fornecedorToEdit.acao;
                    addFornecedorBtn.textContent = 'Atualizar Fornecedor';
                    editingIndex = index;
                    fornecedorFormSection.style.display = 'flex';
                    toggleFornecedorFormBtn.innerHTML = '<i class="fas fa-times"></i> Fechar';
                } else if (target.classList.contains('delete-btn')) {
                    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
                        fornecedores.splice(index, 1);
                        saveData('fornecedores', fornecedores);
                        renderFornecedoresTable();
                        showNotification('Fornecedor excluído com sucesso!', 'success');
                    }
                }
            });
        }
        renderFornecedoresTable();
    }
    function setupRequisicao() {
        const toggleRequisitionFormBtn = document.getElementById('toggle-requisition-form');
        const mainHeader = document.querySelector('.main-header');
        const requisitionTableBody = document.querySelector('#requisition-table tbody');
        let newRequisitionSection = null;
        const renderRequisitionsTable = () => {
            requisitionTableBody.innerHTML = '';
            const filial = localStorage.getItem('selectedFilial');
            const allRequisitions = getData('requisitions');
            const filteredRequisitions = allRequisitions.filter(req => req.filial === filial);
            filteredRequisitions.forEach((req, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><button class="edit-btn" data-index="${index}">✏️</button></td>
                    <td>${req.tipo}</td>
                    <td>${req.data}</td>
                    <td>${req.requisicao}</td>
                    <td>${req.fornecedor}</td>
                    <td>${req.nf}</td>
                    <td>${req.oc}</td>
                    <td>${req.observacao}</td>
                    <td>
                        <span class="status-icon approve-btn" data-index="${index}">✔️</span>
                        <span class="status-icon reject-btn" data-index="${index}">✖️</span>
                    </td>
                `;
                requisitionTableBody.appendChild(row);
            });
        };
        if (toggleRequisitionFormBtn) {
            toggleRequisitionFormBtn.addEventListener('click', () => {
                if (newRequisitionSection) {
                    newRequisitionSection.remove();
                    newRequisitionSection = null;
                    toggleRequisitionFormBtn.innerHTML = '<span>+</span> Requisição';
                } else {
                    newRequisitionSection = document.createElement('section');
                    newRequisitionSection.id = 'new-requisition-section';
                    newRequisitionSection.classList.add('new-requisition-section');
                    newRequisitionSection.innerHTML = `
                        <div class="new-requisition-container">
                            <div class="new-requisition-group">
                                <select id="input-tipo" class="input-select">
                                    <option value="">Tipo</option>
                                    <option value="Nota Fiscal">Nota Fiscal</option>
                                    <option value="Orçamento">Orçamento</option>
                                    <option value="Pedido">Pedido</option>
                                    <option value="Contrato">Contrato</option>
                                </select>
                                <input type="text" id="input-nf" class="input-field" placeholder="NF">
                                <input type="text" id="input-oc" class="input-field" placeholder="OC">
                            </div>
                            <div class="new-requisition-group">
                                <input type="date" id="input-data" class="input-date">
                                <div class="autocomplete-wrapper" style="position:relative; flex: 1; min-width: 120px;">
                                    <input type="text" id="input-fornecedor" class="input-field" placeholder="Fornecedor">
                                    <div id="fornecedor-autocomplete-list" class="autocomplete-list" style="display:none;"></div>
                                </div>
                                <input type="text" id="input-requisicao" class="input-field" placeholder="Requisição">
                            </div>
                            <div style="width: 100%; text-align: right;">
                                <button id="add-requisition-button" class="add-button">Adicionar</button>
                            </div>
                        </div>
                    `;
                    mainHeader.after(newRequisitionSection);
                    toggleRequisitionFormBtn.innerHTML = 'Fechar';
                    setupRequisitionFormListeners();
                }
            });
        }
        const setupRequisitionFormListeners = () => {
            const addRequisitionButton = document.getElementById('add-requisition-button');
            const fornecedorInput = document.getElementById('input-fornecedor');
            const autocompleteList = document.getElementById('fornecedor-autocomplete-list');
            fornecedorInput.addEventListener('input', () => {
                const fornecedores = getData('fornecedores');
                const value = fornecedorInput.value.toLowerCase();
                autocompleteList.innerHTML = '';
                if (value.length === 0) {
                    autocompleteList.style.display = 'none';
                    return;
                }
                const filteredFornecedores = fornecedores.filter(f => f.nome.toLowerCase().includes(value));
                filteredFornecedores.forEach(f => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-list-item';
                    item.textContent = f.nome;
                    item.addEventListener('click', () => {
                        fornecedorInput.value = f.nome;
                        autocompleteList.style.display = 'none';
                    });
                    autocompleteList.appendChild(item);
                });
                autocompleteList.style.display = filteredFornecedores.length > 0 ? 'block' : 'none';
            });
            document.addEventListener('click', (event) => {
                if (!event.target.closest('.autocomplete-wrapper')) {
                    autocompleteList.style.display = 'none';
                }
            });
            addRequisitionButton.addEventListener('click', () => {
                const filial = localStorage.getItem('selectedFilial');
                if (!filial || filial === "todas") {
                    showNotification("Selecione uma Filial para criar a requisição!", "error");
                    return;
                }
                const tipo = document.getElementById('input-tipo').value;
                const nf = document.getElementById('input-nf').value;
                const oc = document.getElementById('input-oc').value;
                const data = document.getElementById('input-data').value;
                const fornecedor = document.getElementById('input-fornecedor').value;
                const requisicao = document.getElementById('input-requisicao').value;
                if (!tipo || !data || !fornecedor || !requisicao) {
                    showNotification("Preencha todos os campos obrigatórios!", "error");
                    return;
                }
                const newRequisition = { id: Date.now(), tipo, data, requisicao, fornecedor, nf, oc, observacao: '', status: 'pendente', filial: filial };
                const allRequisitions = getData('requisitions');
                allRequisitions.push(newRequisition);
                saveData('requisitions', allRequisitions);
                showNotification("Requisição adicionada com sucesso!", "success");
                renderRequisitionsTable();
                document.getElementById('input-tipo').value = '';
                document.getElementById('input-nf').value = '';
                document.getElementById('input-oc').value = '';
                document.getElementById('input-data').value = '';
                document.getElementById('input-fornecedor').value = '';
                document.getElementById('input-requisicao').value = '';
            });
        };
        if (requisitionTableBody) {
            requisitionTableBody.addEventListener('click', (event) => {
                const target = event.target;
                if (target.classList.contains('approve-btn') || target.classList.contains('reject-btn')) {
                    const index = target.dataset.index;
                    const filial = localStorage.getItem('selectedFilial');
                    const allRequisitions = getData('requisitions');
                    const filteredRequisitions = allRequisitions.filter(req => req.filial === filial);
                    const originalRequisition = filteredRequisitions[index];
                    const originalIndex = allRequisitions.findIndex(req => req.id === originalRequisition.id);
                    if (target.classList.contains('approve-btn')) {
                        const fornecedores = getData('fornecedores');
                        const fornecedorEncontrado = fornecedores.find(f => f.nome === originalRequisition.fornecedor);
                        if (!fornecedorEncontrado) {
                            showNotification('Fornecedor não cadastrado! Não é possível aprovar.', 'error');
                            return;
                        }
                        allRequisitions[originalIndex].status = 'aprovado';
                        allRequisitions[originalIndex].tipo_fiscal = fornecedorEncontrado.acordo;
                        saveData('requisitions', allRequisitions);
                        showNotification(`Requisição de ${originalRequisition.fornecedor} aprovada!`, 'success');
                    } else {
                        allRequisitions.splice(originalIndex, 1);
                        saveData('requisitions', allRequisitions);
                        showNotification('Requisição excluída com sucesso!', 'success');
                    }
                    renderRequisitionsTable();
                }
            });
        }
        renderRequisitionsTable();
    }
    function setupFiscal() {
        const xmlTableBody = document.querySelector('#xml-table tbody');
        const portalTableBody = document.querySelector('#portal-table tbody');
        const renderFiscalTables = () => {
            xmlTableBody.innerHTML = '';
            portalTableBody.innerHTML = '';
            const filial = localStorage.getItem('selectedFilial');
            const allRequisitions = getData('requisitions');
            const requisicoesFiscais = allRequisitions.filter(req => req.status === 'aprovado' && req.filial === filial);
            requisicoesFiscais.forEach(req => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${req.tipo}</td>
                    <td>${req.data}</td>
                    <td>${req.requisicao}</td>
                    <td>${req.fornecedor}</td>
                    <td>${req.nf}</td>
                    <td>${req.oc}</td>
                    <td><button class="approve-fiscal-btn" data-id="${req.id}">✔️</button></td>`;
                if (req.tipo_fiscal === '1ª ORACLE - XML - EMAIL' || req.tipo_fiscal === '4ª ORACLE - XML E PAGAMENTOS - EMAIL') {
                    xmlTableBody.appendChild(row);
                } else {
                    portalTableBody.appendChild(row);
                }
            });
        };
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('approve-fiscal-btn')) {
                const reqId = parseInt(event.target.dataset.id);
                const allRequisitions = getData('requisitions');
                const req = allRequisitions.find(r => r.id === reqId);
                if (req) {
                    req.status_pagamento = 'pendente';
                    saveData('requisitions', allRequisitions);
                    showNotification('Requisição enviada para Pagamentos!', 'success');
                    renderFiscalTables();
                }
            }
        });
        renderFiscalTables();
    }
    function setupPagamentos() {
        const pagamentosTableBody = document.querySelector('#pagamentos-table tbody');
        const renderPagamentosTable = () => {
            pagamentosTableBody.innerHTML = '';
            const filial = localStorage.getItem('selectedFilial');
            const allRequisitions = getData('requisitions');
            const requisicoesPagamento = allRequisitions.filter(req => req.status_pagamento === 'pendente' && req.filial === filial);
            requisicoesPagamento.forEach(req => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${req.tipo}</td>
                    <td>${req.data}</td>
                    <td>${req.requisicao}</td>
                    <td>${req.fornecedor}</td>
                    <td>${req.filial}</td>
                    <td><span class="status-icon approved">✔️</span></td>
                    <td><button class="realizado-btn" data-id="${req.id}">Realizado</button></td>
                `;
                pagamentosTableBody.appendChild(row);
            });
        };
        pagamentosTableBody.addEventListener('click', (event) => {
            if (event.target.classList.contains('realizado-btn')) {
                const reqId = parseInt(event.target.dataset.id);
                const allRequisitions = getData('requisitions');
                const req = allRequisitions.find(r => r.id === reqId);
                if (req) {
                    req.status_pagamento = 'realizado';
                    saveData('requisitions', allRequisitions);
                    showNotification('Pagamento marcado como realizado!', 'success');
                    renderPagamentosTable();
                }
            }
        });
        renderPagamentosTable();
    }
    function setupContratos() {
        const toggleContratoFormBtn = document.getElementById('toggle-contrato-form');
        const contratoFormSection = document.getElementById('new-contrato-section');
        const addContratoBtn = document.getElementById('add-contrato-button');
        const contratosTableBody = document.querySelector('#contratos-table-body');
        const contratoForm = document.getElementById('contrato-form');
        let editingIndex = null;
        const renderContratosTable = () => {
            contratosTableBody.innerHTML = '';
            const contratos = getData('contratos');
            contratos.forEach((contrato, index) => {
                const row = document.createElement('tr');
                row.dataset.index = index;
                row.innerHTML = `
                    <td>${contrato.numero}</td>
                    <td>${contrato.fornecedor}</td>
                    <td>${contrato.inicio}</td>
                    <td>${contrato.fim}</td>
                    <td>${contrato.valor}</td>
                    <td>${contrato.status}</td>
                    <td>
                        <button class="edit-btn" data-index="${index}"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
                    </td>`;
                contratosTableBody.appendChild(row);
            });
        };
        const resetForm = () => {
            contratoForm.reset();
            addContratoBtn.textContent = 'Adicionar Contrato';
            editingIndex = null;
        };
        if (toggleContratoFormBtn) {
            toggleContratoFormBtn.addEventListener('click', () => {
                const isVisible = contratoFormSection.style.display === 'flex';
                contratoFormSection.style.display = isVisible ? 'none' : 'flex';
                toggleContratoFormBtn.innerHTML = isVisible ? '<i class="fas fa-plus"></i> Contrato' : '<i class="fas fa-times"></i> Fechar';
                if (!isVisible) {
                    resetForm();
                }
            });
        }
        if (addContratoBtn) {
            addContratoBtn.addEventListener('click', () => {
                const numero = document.getElementById('contrato-numero').value;
                const fornecedor = document.getElementById('contrato-fornecedor').value;
                const inicio = document.getElementById('contrato-inicio').value;
                const fim = document.getElementById('contrato-fim').value;
                const valor = document.getElementById('contrato-valor').value;
                const status = document.getElementById('contrato-status').value;

                if (!numero || !fornecedor || !inicio || !fim || !valor || !status) {
                    showNotification('Preencha todos os campos do contrato!', 'error');
                    return;
                }

                let contratos = getData('contratos');
                const newContrato = { numero, fornecedor, inicio, fim, valor, status };

                if (editingIndex !== null) {
                    contratos[editingIndex] = newContrato;
                    showNotification('Contrato atualizado com sucesso!', 'success');
                } else {
                    contratos.push(newContrato);
                    showNotification('Contrato adicionado com sucesso!', 'success');
                }
                
                saveData('contratos', contratos);
                renderContratosTable();
                resetForm();
                contratoFormSection.style.display = 'none';
                toggleContratoFormBtn.innerHTML = '<i class="fas fa-plus"></i> Contrato';
            });
        }

        if (contratosTableBody) {
            contratosTableBody.addEventListener('click', (event) => {
                const target = event.target.closest('button');
                if (!target) return;
                
                const row = target.closest('tr');
                const index = row.dataset.index;
                let contratos = getData('contratos');

                if (target.classList.contains('edit-btn')) {
                    const contratoToEdit = contratos[index];
                    document.getElementById('contrato-numero').value = contratoToEdit.numero;
                    document.getElementById('contrato-fornecedor').value = contratoToEdit.fornecedor;
                    document.getElementById('contrato-inicio').value = contratoToEdit.inicio;
                    document.getElementById('contrato-fim').value = contratoToEdit.fim;
                    document.getElementById('contrato-valor').value = contratoToEdit.valor;
                    document.getElementById('contrato-status').value = contratoToEdit.status;

                    addContratoBtn.textContent = 'Atualizar Contrato';
                    editingIndex = index;
                    contratoFormSection.style.display = 'flex';
                    toggleContratoFormBtn.innerHTML = '<i class="fas fa-times"></i> Fechar';

                } else if (target.classList.contains('delete-btn')) {
                    if (confirm('Tem certeza que deseja excluir este contrato?')) {
                        contratos.splice(index, 1);
                        saveData('contratos', contratos);
                        renderContratosTable();
                        showNotification('Contrato excluído com sucesso!', 'success');
                    }
                }
            });
        }

        renderContratosTable();
    }
});