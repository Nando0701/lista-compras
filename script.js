document.addEventListener('DOMContentLoaded', () => {
    // Seletores de Elementos do DOM
    const filtroSelect = document.getElementById('filtro-itens');
    const listaDeComprasUl = document.getElementById('lista-de-compras');
    const novoItemInput = document.getElementById('novo-item-input');
    const salvarBackupBtn = document.getElementById('salvar-backup-btn');
    const abrirBackupBtn = document.getElementById('abrir-backup-btn');

    // Estado da Aplicação
    let items = []; // Array para armazenar os itens da lista
    let filtroAtual = 'todos'; // 'todos', 'a-comprar', 'nao-selecionados'

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

    function carregarItemsDoLocalStorage() {
        const itemsSalvos = localStorage.getItem('listaDeComprasItemsV2');
        if (itemsSalvos) {
            items = JSON.parse(itemsSalvos);
        }
        // Se não houver itens salvos, 'items' continuará como um array vazio.
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO E MANIPULAÇÃO DA LISTA ---
    function renderizarLista() {
        listaDeComprasUl.innerHTML = ''; // Limpa a lista atual no DOM

        let itemsParaRenderizar = items;

        // Aplica o filtro selecionado
        if (filtroAtual === 'a-comprar') {
            // Esta lógica dependerá de como "a-comprar" é definido.
            // Por agora, vamos assumir que itens não marcados (comprado: false) são "a-comprar".
            itemsParaRenderizar = items.filter(item => !item.marcado); // 'marcado' será a propriedade
        } else if (filtroAtual === 'nao-selecionados') {
            // Lógica para "não selecionados" - A ser definida
            // Por enquanto, mostra todos, similar a 'todos'
            itemsParaRenderizar = items.filter(item => !item.marcado); // Exemplo, pode mudar
        }
        // Se 'todos', itemsParaRenderizar já é a lista completa.

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
            if (item.marcado) { // Usaremos 'marcado' para o estado do carrinho/seleção
                li.classList.add('marcado');
            }

            // Botão Carrinho
            const btnCarrinho = document.createElement('button');
            btnCarrinho.classList.add('btn-carrinho');
            btnCarrinho.innerHTML = ICONE_CARRINHO;
            btnCarrinho.setAttribute('aria-label', item.marcado ? 'Desmarcar item' : 'Marcar item');
            btnCarrinho.addEventListener('click', () => toggleMarcarItem(item.id));

            // Nome do Item
            const nomeSpan = document.createElement('span');
            nomeSpan.classList.add('nome-item');
            nomeSpan.textContent = item.nome;

            // Botão Lixeira
            const btnLixeira = document.createElement('button');
            btnLixeira.classList.add('btn-lixeira');
            btnLixeira.innerHTML = ICONE_LIXEIRA;
            btnLixeira.setAttribute('aria-label', 'Remover item');
            btnLixeira.addEventListener('click', () => removerItemDaLista(item.id));

            li.appendChild(btnCarrinho);
            li.appendChild(nomeSpan);
            li.appendChild(btnLixeira);
            listaDeComprasUl.appendChild(li);
        });
    }

    function adicionarNovoItem() {
        const nomeDoItem = novoItemInput.value.trim();
        if (nomeDoItem === '') {
            // Poderia mostrar uma mensagem mais sutil em vez de alert
            console.warn('Tentativa de adicionar item vazio.');
            return;
        }

        const novoItem = {
            id: Date.now().toString(), // ID único como string
            nome: nomeDoItem,
            marcado: false // Novo item começa como não marcado/não no carrinho
        };

        items.unshift(novoItem); // Adiciona no início da lista para visualização imediata
        novoItemInput.value = ''; // Limpa o input
        salvarItemsNoLocalStorage();
        renderizarLista();
        // novoItemInput.focus(); // Pode ser irritante no mobile reabrir o teclado sempre
    }

    function toggleMarcarItem(idDoItem) {
        const itemIndex = items.findIndex(item => item.id === idDoItem);
        if (itemIndex > -1) {
            items[itemIndex].marcado = !items[itemIndex].marcado;
            salvarItemsNoLocalStorage();
            renderizarLista(); // Re-renderiza para atualizar o estilo e o aria-label
        }
    }

    function removerItemDaLista(idDoItem) {
        const itemParaRemover = items.find(item => item.id === idDoItem);
        if (itemParaRemover && confirm(`Tem certeza que deseja remover "${itemParaRemover.nome}" da lista?`)) {
            items = items.filter(item => item.id !== idDoItem);
            salvarItemsNoLocalStorage();
            renderizarLista();
        }
    }

    // --- FUNÇÕES DE BACKUP (Placeholder) ---
    function salvarBackup() {
        if (items.length === 0) {
            alert("Sua lista está vazia. Não há nada para salvar.");
            return;
        }
        const dataStr = JSON.stringify(items, null, 2); // Formato JSON legível
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `lista_compras_backup_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click(); // Simula o clique para iniciar o download
        alert("Backup salvo! Verifique seus downloads.");
    }

    function abrirBackup() {
        const inputArquivo = document.createElement('input');
        inputArquivo.type = 'file';
        inputArquivo.accept = '.json,application/json'; // Aceita arquivos .json
        
        inputArquivo.onchange = event => {
            const arquivo = event.target.files[0];
            if (arquivo) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const itemsImportados = JSON.parse(e.target.result);
                        // Validação básica dos itens importados (opcional, mas bom ter)
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
        inputArquivo.click(); // Abre a caixa de diálogo para selecionar arquivo
    }


    // --- EVENT LISTENERS ---
    // Adicionar item com a tecla "Enter" no input
    novoItemInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Previne qualquer comportamento padrão do Enter (ex: submit de formulário)
            adicionarNovoItem();
        }
    });

    // Mudar filtro
    filtroSelect.addEventListener('change', (event) => {
        filtroAtual = event.target.value;
        renderizarLista();
    });

    // Botões de Backup
    salvarBackupBtn.addEventListener('click', salvarBackup);
    abrirBackupBtn.addEventListener('click', abrirBackup);

    // --- INICIALIZAÇÃO ---
    function inicializarApp() {
        carregarItemsDoLocalStorage();
        renderizarLista();
        // Define o valor do select para o filtro atual (caso a página seja recarregada)
        filtroSelect.value = filtroAtual; 
    }

    inicializarApp();
});
