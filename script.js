```javascript
document.addEventListener('DOMContentLoaded', () => {
    const filtroSelect = document.getElementById('filtro-itens');
    const listaDeComprasUl = document.getElementById('lista-de-compras');
    const novoItemInput = document.getElementById('novo-item-input');
    const salvarBackupBtn = document.getElementById('salvar-backup-btn');
    const abrirBackupBtn = document.getElementById('abrir-backup-btn');

    function setViewportHeightProperty() {
        setTimeout(() => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }, 150); 
    }

    window.addEventListener('load', setViewportHeightProperty);
    window.addEventListener('resize', setViewportHeightProperty);

    if (novoItemInput) {
        novoItemInput.addEventListener('focus', setViewportHeightProperty);
        novoItemInput.addEventListener('blur', setViewportHeightProperty);
    }
    
    setViewportHeightProperty();

    let items = []; 
    let filtroAtual = 'todos'; // Opções: 'todos', 'a-comprar', 'no-carrinho', 'default'

    const ICONE_CARRINHO = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L3.62 17H19v-2H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0021.79 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"></path>
        </svg>`;
    const ICONE_LIXEIRA = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
        </svg>`;

    function salvarItemsNoLocalStorage() {
        localStorage.setItem('listaDeComprasItemsV3', JSON.stringify(items)); // Chave atualizada para V3 devido à mudança de estrutura
    }

    function carregarItemsDoLocalStorage() {
        const itemsSalvos = localStorage.getItem('listaDeComprasItemsV3'); // Usa a nova chave
        let tempItems = [];
        if (itemsSalvos) {
            try {
                const parsedItems = JSON.parse(itemsSalvos);
                if (Array.isArray(parsedItems)) {
                    tempItems = parsedItems.map(item => {
                        // Migração de dados: se statusCompra não existe, tenta derivar de 'marcado'
                        let statusCompra = 0; // Default
                        if (item.statusCompra !== undefined) {
                            statusCompra = item.statusCompra;
                        } else if (item.marcado === true) { // 'marcado' era para "no carrinho" (verde)
                            statusCompra = 2;
                        } // Se 'marcado' era false ou não existia, fica 0 (default)
                        
                        return {
                            ...item,
                            statusCompra: statusCompra,
                            marcado: undefined // Remove a propriedade antiga 'marcado'
                        };
                    });
                }
            } catch (e) {
                console.error("Erro ao carregar itens do localStorage:", e);
                // tempItems continua como array vazio
            }
        }
        items = tempItems; // Atribui o array processado (ou vazio) a items
    }


    function renderizarLista() {
        listaDeComprasUl.innerHTML = '';
        let itemsParaRenderizar = [...items]; 

        // Aplica o filtro selecionado
        if (filtroAtual === 'a-comprar') { // Itens a comprar (vermelho)
            itemsParaRenderizar = itemsParaRenderizar.filter(item => item.statusCompra === 1);
        } else if (filtroAtual === 'no-carrinho') { // Itens no carrinho (verde)
            itemsParaRenderizar = itemsParaRenderizar.filter(item => item.statusCompra === 2);
        } else if (filtroAtual === 'default') { // Itens default (cinza)
            itemsParaRenderizar = itemsParaRenderizar.filter(item => item.statusCompra === 0);
        }
        // Se filtroAtual === 'todos', itemsParaRenderizar já é a lista completa (copiada).
        
        itemsParaRenderizar.sort((a, b) => 
            a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' })
        );

        if (itemsParaRenderizar.length === 0) {
            const liVazia = document.createElement('li');
            liVazia.classList.add('lista-vazia-mensagem');
            if (items.length === 0) {
                liVazia.textContent = 'Sua lista está vazia. Adicione itens abaixo!';
            } else {
                liVazia.textContent = 'Nenhum item corresponde ao filtro selecionado.';
            }
            listaDeComprasUl.appendChild(liVazia);
            return;
        }

        itemsParaRenderizar.forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            
            // Limpa classes de status anteriores e adiciona a atual
            li.classList.remove('status-default', 'status-comprar', 'status-no-carrinho');
            let ariaLabelCarrinho = '';

            switch (item.statusCompra) {
                case 1: // Comprar (Vermelho)
                    li.classList.add('status-comprar');
                    ariaLabelCarrinho = 'Marcar como "no carrinho" (verde)';
                    break;
                case 2: // No Carrinho (Verde)
                    li.classList.add('status-no-carrinho');
                    ariaLabelCarrinho = 'Resetar item (cinza)';
                    break;
                case 0: // Default (Cinza)
                default: // Trata qualquer valor inesperado como default
                    li.classList.add('status-default');
                    ariaLabelCarrinho = 'Marcar como "a comprar" (vermelho)';
                    break;
            }

            const btnCarrinho = document.createElement('button');
            btnCarrinho.classList.add('btn-carrinho');
            btnCarrinho.innerHTML = ICONE_CARRINHO;
            btnCarrinho.setAttribute('aria-label', ariaLabelCarrinho);
            btnCarrinho.addEventListener('click', () => ciclarStatusCompra(item.id));

            const nomeSpan = document.createElement('span');
            nomeSpan.classList.add('nome-item');
            nomeSpan.textContent = item.nome;

            const btnLixeira = document.createElement('button');
            btnLixeira.classList.add('btn-lixeira');
            btnLixeira.innerHTML = ICONE_LIXEIRA;
            btnLixeira.setAttribute('aria-label', 'Remover item');
            btnLixeira.addEventListener('click', (event) => removerItemDaLista(event, item.id));

            li.appendChild(btnCarrinho);
            li.appendChild(nomeSpan);
            li.appendChild(btnLixeira);
            listaDeComprasUl.appendChild(li);
        });
    }

    function adicionarNovoItem() {
        const nomeDoItem = novoItemInput.value.trim();
        if (nomeDoItem === '') {
            return;
        }
        const novoItem = {
            id: Date.now().toString(),
            nome: nomeDoItem,
            statusCompra: 0 // Novo item começa no estado default (0)
        };
        items.unshift(novoItem); 
        novoItemInput.value = '';
        salvarItemsNoLocalStorage();
        renderizarLista(); 
    }

    // Nova função para ciclar o status de compra
    function ciclarStatusCompra(idDoItem) {
        const itemIndex = items.findIndex(item => item.id === idDoItem);
        if (itemIndex > -1) {
            let statusAtual = items[itemIndex].statusCompra || 0; // Garante que é um número, default 0
            statusAtual = (statusAtual + 1) % 3; // Cicla 0 -> 1 -> 2 -> 0
            items[itemIndex].statusCompra = statusAtual;
            salvarItemsNoLocalStorage();
            renderizarLista();
        }
    }

    function removerItemDaLista(event, idDoItem) {
        const itemParaRemover = items.find(item => item.id === idDoItem);
        if (itemParaRemover && confirm(`Tem certeza que deseja remover "${itemParaRemover.nome}" da lista?`)) {
            if (event && event.currentTarget && typeof event.currentTarget.blur === 'function') {
                event.currentTarget.blur();
            }
            items = items.filter(item => item.id !== idDoItem);
            salvarItemsNoLocalStorage();
            renderizarLista();
        }
    }

    function salvarBackup() {
        if (items.length === 0) {
            alert("Sua lista está vazia. Não há nada para salvar.");
            return;
        }
        const dataStr = JSON.stringify(items.map(item => ({id: item.id, nome: item.nome, statusCompra: item.statusCompra || 0})), null, 2); // Garante que statusCompra seja salvo
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `lista_compras_backup_${new Date().toISOString().slice(0,10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    function abrirBackup() {
        const inputArquivo = document.createElement('input');
        inputArquivo.type = 'file';
        inputArquivo.accept = '.json,application/json';
        inputArquivo.onchange = event => {
            const arquivo = event.target.files[0];
            if (arquivo) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const itemsImportados = JSON.parse(e.target.result);
                        if (Array.isArray(itemsImportados) && itemsImportados.every(item => item.id && item.nome !== undefined)) {
                            if (confirm("Isso substituirá sua lista atual. Deseja continuar?")) {
                                // Mapeia os itens importados para garantir a estrutura correta e migrar 'marcado' se 'statusCompra' não existir
                                items = itemsImportados.map(importedItem => {
                                    let statusCompra = 0; // Default
                                    if (importedItem.statusCompra !== undefined) {
                                        statusCompra = importedItem.statusCompra;
                                    } else if (importedItem.marcado === true) {
                                        statusCompra = 2; // 'marcado' true -> no carrinho
                                    }
                                    return {
                                        id: importedItem.id,
                                        nome: importedItem.nome,
                                        statusCompra: statusCompra
                                    };
                                });
                                salvarItemsNoLocalStorage(); 
                                renderizarLista(); 
                                alert("Backup restaurado com sucesso!");
                            }
                        } else {
                            alert("Arquivo de backup inválido ou formato incorreto.");
                        }
                    } catch (error) {
                        console.error("Erro ao processar arquivo de backup:", error);
                        alert("Erro ao ler o arquivo de backup. Verifique se é um JSON válido.");
                    }
                };
                reader.readAsText(arquivo);
            }
        };
        inputArquivo.click();
    }

    novoItemInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            adicionarNovoItem();
        }
    });

    filtroSelect.addEventListener('change', (event) => {
        filtroAtual = event.target.value;
        renderizarLista();
    });

    salvarBackupBtn.addEventListener('click', salvarBackup);
    abrirBackupBtn.addEventListener('click', abrirBackup);

    function inicializarApp() {
        carregarItemsDoLocalStorage();
        renderizarLista(); 
        filtroSelect.value = filtroAtual;
    }

    inicializarApp();
});