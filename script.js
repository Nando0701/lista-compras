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
    let filtroAtual = 'todos'; 

    const ICONE_CARRINHO = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L3.62 17H19v-2H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0021.79 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"></path>
        </svg>`;
    const ICONE_LIXEIRA = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
        </svg>`;

    function salvarItemsNoLocalStorage() {
        localStorage.setItem('listaDeComprasItemsV3', JSON.stringify(items));
    }

    // Função carregarItemsDoLocalStorage ATUALIZADA para maior robustez
    function carregarItemsDoLocalStorage() {
        const itemsSalvos = localStorage.getItem('listaDeComprasItemsV3');
        let tempItems = []; // Sempre inicializa como array
        if (itemsSalvos) {
            try {
                const parsedItems = JSON.parse(itemsSalvos);
                if (Array.isArray(parsedItems)) {
                    // Filtra por itens válidos e mapeia para a estrutura correta
                    tempItems = parsedItems
                        .filter(item => item && typeof item.id === 'string' && typeof item.nome === 'string') // Garante que id e nome existam e sejam strings
                        .map(item => {
                            let statusCompra = 0; // Default
                            // Valida e normaliza statusCompra
                            if (item.statusCompra !== undefined && typeof item.statusCompra === 'number') {
                                statusCompra = Math.min(Math.max(0, item.statusCompra), 2); // Garante que seja 0, 1 ou 2
                            } else if (item.marcado === true) { // Migração da propriedade antiga 'marcado'
                                statusCompra = 2; // 'marcado' true -> no carrinho (verde)
                            }
                            
                            return { // Retorna um objeto com estrutura garantida
                                id: item.id,
                                nome: item.nome,
                                statusCompra: statusCompra
                                // A propriedade 'marcado' é intencionalmente omitida
                            };
                        });
                } else {
                     console.warn("Dados do localStorage não eram um array. Lista iniciada vazia.");
                }
            } catch (e) {
                console.error("Erro ao carregar itens do localStorage (JSON inválido ou outro erro):", e);
                // tempItems permanece como array vazio em caso de erro
            }
        }
        items = tempItems; // Atribui o array processado (ou vazio) a items
    }


    function renderizarLista() {
        listaDeComprasUl.innerHTML = '';
        let itemsParaRenderizar = [...items]; 

        if (filtroAtual === 'a-comprar') { 
            itemsParaRenderizar = itemsParaRenderizar.filter(item => item.statusCompra === 1);
        } else if (filtroAtual === 'no-carrinho') { 
            itemsParaRenderizar = itemsParaRenderizar.filter(item => item.statusCompra === 2);
        } else if (filtroAtual === 'default') { 
            itemsParaRenderizar = itemsParaRenderizar.filter(item => item.statusCompra === 0);
        }
        
        // Ordenação mais segura
        itemsParaRenderizar.sort((a, b) => {
            const nameA = a.nome || ''; // Trata nome indefinido
            const nameB = b.nome || ''; // Trata nome indefinido
            return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        });

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
            
            li.classList.remove('status-default', 'status-comprar', 'status-no-carrinho');
            let ariaLabelCarrinho = '';

            switch (item.statusCompra) {
                case 1: 
                    li.classList.add('status-comprar');
                    ariaLabelCarrinho = 'Marcar como "no carrinho" (verde)';
                    break;
                case 2: 
                    li.classList.add('status-no-carrinho');
                    ariaLabelCarrinho = 'Resetar item (cinza)';
                    break;
                case 0: 
                default: 
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
            statusCompra: 0 
        };
        // Garante que 'items' seja um array. Embora carregarItemsDoLocalStorage() deva cuidar disso,
        // esta é uma segurança adicional.
        if (!Array.isArray(items)) {
            console.error("items não é um array em adicionarNovoItem. Redefinindo para [].");
            items = [];
        }
        items.unshift(novoItem); 
        novoItemInput.value = '';
        salvarItemsNoLocalStorage();
        renderizarLista(); 
    }

    function ciclarStatusCompra(idDoItem) {
        const itemIndex = items.findIndex(item => item.id === idDoItem);
        if (itemIndex > -1) {
            let statusAtual = items[itemIndex].statusCompra || 0; 
            statusAtual = (statusAtual + 1) % 3; 
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
        const dataStr = JSON.stringify(items.map(item => ({id: item.id, nome: item.nome, statusCompra: item.statusCompra || 0})), null, 2);
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
                        // Validação mais robusta dos itens importados
                        if (Array.isArray(itemsImportados) && 
                            itemsImportados.every(item => item && typeof item.id === 'string' && typeof item.nome === 'string')) {
                            if (confirm("Isso substituirá sua lista atual. Deseja continuar?")) {
                                items = itemsImportados.map(importedItem => {
                                    let statusCompra = 0; 
                                    if (importedItem.statusCompra !== undefined && typeof importedItem.statusCompra === 'number') {
                                        statusCompra = Math.min(Math.max(0, importedItem.statusCompra), 2);
                                    } else if (importedItem.marcado === true) {
                                        statusCompra = 2; 
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
                            alert("Arquivo de backup inválido ou formato incorreto. Verifique se cada item possui 'id' e 'nome'.");
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
