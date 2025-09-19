// --- REQUISIÇÕES ---
async function setupRequisicao() {
    const requisitionTableBody = document.getElementById('requisition-table-body');
    const addRequisicaoBtn = document.getElementById('toggle-requisition-form');
    const requisicaoFormSection = document.getElementById('new-requisicao-section');
    const requisicaoForm = document.getElementById('requisicao-form');
    const mainHeader = document.querySelector('.main-header');
    const requisicaoFilialSelect = document.getElementById('requisicao-filial');

    const renderFilialSelect = async () => {
        const filiais = await fetchData('filiais');
        if (requisicaoFilialSelect) {
            filiais.forEach(filial => {
                const option = document.createElement('option');
                option.value = filial.nome;
                option.textContent = filial.nome;
                requisicaoFilialSelect.appendChild(option);
            });
        }
    };
    
    await renderFilialSelect();

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
            
            const isNFandOCFilled = req.nf && req.oc;
            const approveButtonHtml = isNFandOCFilled 
                ? `<span class="status-icon approve-btn" data-id="${req.id}">✔️</span>`
                : `<span class="status-icon" style="color:#ccc;">✔️</span>`;

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
                    ${approveButtonHtml}
                    <span class="status-icon reject-btn" data-id="${req.id}">✖️</span>
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

            try {
                const response = await fetch(`${API_URL}/requisicoes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requisicaoData)
                });
                
                if (!response.ok) {
                    throw new Error('Falha na resposta do servidor.');
                }
                
                const newRequisition = await response.json();
                
                showNotification('Requisição adicionada!', 'success');
                requisicaoForm.reset();
                requisicaoFormSection.style.display = 'none';
                mainHeader.classList.remove('form-open');

                addRequisitionToTable(newRequisition);

            } catch (error) {
                console.error('Erro ao adicionar requisição:', error);
                showNotification(`Falha ao adicionar requisição: ${error.message}`, 'error');
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
    setupFornecedorAutocomplete('requisicao-fornecedor', 'requisicao-fornecedor-suggestions');
}
