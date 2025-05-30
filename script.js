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
    
    setViewportHeightProperty();

    if (novoItemInput) {
        novoItemInput.addEventListener('focus', setViewportHeightProperty);
        novoItemInput.addEventListener('blur', setViewportHeightProperty);
        
        novoItemInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                adicionarNovoItem();
            }
        });
    } else {
        console.error("ERRO: Elemento 'novo-item-input' não foi encontrado no DOM.");
    }

    let items = []; 
    let filtroAtual = 'todos'; // Opções: 'todos', 'pendentes', 'comprados'

    const ICONE_CARRINHO = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L3.62 17H19v-2H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0021.79 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"></path>
        </svg>`;
    const ICONE_LIXEIRA = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
        </svg>`;

    function salvarItemsNoLocalStorage() {
        // Usando a chave 'listaDeComprasItemsV2' como na versão estável anterior
        localStorage.setItem('listaDeComprasItemsV2', JSON.stringify(items));
    }

    function carregarItemsDoLocalStorage() {
        // Usando a chave 'listaDeComprasItemsV2'
        const itemsSalvos = localStorage.getItem('listaDeComprasItemsV2');
        let tempItems = []; 
        if (itemsSalvos) {
            try {
                const parsedItems = JSON.parse(itemsSalvos);
                if (Array.isArray(parsedItems)) {
                    tempItems = parsedItems
                        .filter(item => item && typeof item.id === 'string' && typeof item.nome === 'string') 
                        .map(item => ({ 
                            id: item.id,
                            nome: item.nome,
                            // Garante que 'marcado' seja booleano, default false
                            marcado: typeof item.marcado === 'boolean' ? item.marcado : false 
                        }));
                } else {
                     console.warn("Dados do localStorage (V2) não eram um array. Lista iniciada vazia.");
                }
            } catch (e) {
                console.error("Erro ao carregar itens do localStorage (V2):", e);
            }
        }
        items = tempItems; 
    }


    function renderizarLista() {
        listaDeComprasUl.innerHTML = '';
        let itemsParaRenderizar = [...items]; 

        // Lógica de filtro para 'pendentes' e 'comprados' baseada em item.marcado
        if (filtroAtual === 'pendentes') { 
            itemsParaRenderizar = itemsParaRenderizar.filter(item => !item.marcado);
        } else if (filtroAtual === 'comprados') { 
            itemsParaRenderizar = itemsParaRenderizar.filter(item => item.marcado);
        }
        
        itemsParaRenderizar.sort((a, b) => {
            const nameA = a.nome || ''; 
            const nameB = b.nome || ''; 
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
            
            // Aplica a classe '.marcado' se o item estiver marcado
            if (item.marcado) {
                li.classList.add('marcado');
            }

            const btnCarrinho = document.createElement('button');
            btnCarrinho.classList.add('btn-carrinho');
            btnCarrinho.innerHTML = ICONE_CARRINHO;
            // Aria-label simples para marcar/desmarcar
            btnCarrinho.setAttribute('aria-label', item.marcado ? 'Desmarcar item' : 'Marcar item');
            // Chama toggleMarcarItem (lógica antiga de 2 estados)
            btnCarrinho.addEventListener('click', () => toggleMarcarItem(item.id));

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
            marcado: false // Itens são adicionados como não marcados
        };
        
        if (!Array.isArray(items)) {
            items = [];
        }
        items.unshift(novoItem); 
        novoItemInput.value = '';
        salvarItemsNoLocalStorage();
        renderizarLista(); 
    }

    // Função para alternar o estado 'marcado' (2 estados: marcado/não marcado)
    function toggleMarcarItem(idDoItem) {
        const itemIndex = items.findIndex(item => item.id === idDoItem);
        if (itemIndex > -1) {
            items[itemIndex].marcado = !items[itemIndex].marcado;
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
        // Salva itens com a propriedade 'marcado'
        const dataStr = JSON.stringify(items.map(item => ({id: item.id, nome: item.nome, marcado: item.marcado || false})), null, 2);
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
                        if (Array.isArray(itemsImportados) && 
                            itemsImportados.every(item => item && typeof item.id === 'string' && typeof item.nome === 'string')) {
                            if (confirm("Isso substituirá sua lista atual. Deseja continuar?")) {
                                items = itemsImportados.map(importedItem => ({
                                    id: importedItem.id,
                                    nome: importedItem.nome,
                                    // Garante que 'marcado' seja booleano ao importar
                                    marcado: typeof importedItem.marcado === 'boolean' ? importedItem.marcado : false
                                }));
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

    filtroSelect.addEventListener('change', (event) => {
        filtroAtual = event.target.value;
        renderizarLista();
    });

    salvarBackupBtn.addEventListener('click', salvarBackup);
    abrirBackupBtn.addEventListener('click', abrirBackup);

    function inicializarApp() {
        carregarItemsDoLocalStorage();
        renderizarLista(); 
        if (filtroSelect.querySelector(`option[value="${filtroAtual}"]`)) {
            filtroSelect.value = filtroAtual;
        } else {
            filtroAtual = 'todos';
            filtroSelect.value = 'todos';
        }
    }

    inicializarApp();
});
