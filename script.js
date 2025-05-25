document.addEventListener('DOMContentLoaded', () => {
    const filtroSelect = document.getElementById('filtro-itens');
    const listaDeComprasUl = document.getElementById('lista-de-compras');
    const novoItemInput = document.getElementById('novo-item-input');
    const salvarBackupBtn = document.getElementById('salvar-backup-btn');
    const abrirBackupBtn = document.getElementById('abrir-backup-btn');

    // --- FUNÇÃO PARA AJUSTAR ALTURA DA VIEWPORT DINAMICAMENTE ---
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
    
    setViewportHeightProperty(); // Chamada inicial

    // Estado da Aplicação
    let items = []; // Inicializa como array vazio
    let filtroAtual = 'todos';

    // --- ÍCONES SVG ---
    const ICONE_CARRINHO = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L3.62 17H19v-2H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0021.79 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"></path>
        </svg>`;
    const ICONE_LIXEIRA = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
        </svg>`;

    // --- FUNÇÕES DE PERSISTÊNCIA (Local Storage) ---
    function salvarItemsNoLocalStorage() {
        localStorage.setItem('listaDeComprasItemsV2', JSON.stringify(items));
    }

    // Função carregarItemsDoLocalStorage ATUALIZADA para maior robustez
    function carregarItemsDoLocalStorage() {
        const itemsSalvos = localStorage.getItem('listaDeComprasItemsV2');
        if (itemsSalvos) {
            try {
                const parsedItems = JSON.parse(itemsSalvos);
                // Verifica se o resultado do parse é um array
                if (Array.isArray(parsedItems)) {
                    items = parsedItems;
                } else {
                    // Se não for um array (ex: JSON.parse("null") retorna null),
                    // redefina 'items' para um array vazio para evitar erros.
                    items = [];
                    console.warn("Dados do localStorage não eram um array. Lista redefinida para vazia.");
                }
            } catch (e) {
                // Se houver um erro ao fazer o parse do JSON (ex: JSON malformado),
                // redefina 'items' para um array vazio.
                console.error("Erro ao carregar itens do localStorage:", e);
                items = [];
            }
        } else {
            // Se não houver 'itemsSalvos' (primeira vez usando ou localStorage limpo),
            // garante que 'items' seja um array vazio.
            items = [];
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO E MANIPULAÇÃO DA LISTA ---
    function renderizarLista() {
        listaDeComprasUl.innerHTML = '';

        let itemsParaRenderizar = [...items]; 

        if (filtroAtual === 'a-comprar') {
            itemsParaRenderizar = itemsParaRenderizar.filter(item => !item.marcado);
        } else if (filtroAtual === 'nao-selecionados') {
            itemsParaRenderizar = itemsParaRenderizar.filter(item => !item.marcado); 
        }
        
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
            if (item.marcado) {
                li.classList.add('marcado');
            }

            const btnCarrinho = document.createElement('button');
            btnCarrinho.classList.add('btn-carrinho');
            btnCarrinho.innerHTML = ICONE_CARRINHO;
            btnCarrinho.setAttribute('aria-label', item.marcado ? 'Desmarcar item' : 'Marcar item');
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
            marcado: false
        };
        // Garante que 'items' é um array antes de usar 'unshift'
        if (!Array.isArray(items)) {
            items = []; // Segurança adicional, embora carregarItemsDoLocalStorage já deva garantir isso.
        }
        items.unshift(novoItem); 
        novoItemInput.value = '';
        salvarItemsNoLocalStorage();
        renderizarLista(); 
    }

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

    // --- FUNÇÕES DE BACKUP ---
    function salvarBackup() {
        if (items.length === 0) {
            alert("Sua lista está vazia. Não há nada para salvar.");
            return;
        }
        const dataStr = JSON.stringify(items, null, 2);
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
                        if (Array.isArray(itemsImportados) && itemsImportados.every(item => item.id && item.nome !== undefined && typeof item.marcado === 'boolean')) {
                            if (confirm("Isso substituirá sua lista atual. Deseja continuar?")) {
                                items = itemsImportados;
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

    // --- EVENT LISTENERS ---
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

    // --- INICIALIZAÇÃO ---
    function inicializarApp() {
        carregarItemsDoLocalStorage(); // Agora mais robusta
        renderizarLista(); 
        filtroSelect.value = filtroAtual;
    }

    inicializarApp();
});