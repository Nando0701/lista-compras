document.addEventListener('DOMContentLoaded', () => {
    const novoItemInput = document.getElementById('novo-item-input');
    const adicionarItemBtn = document.getElementById('adicionar-item-btn');
    const listaDeComprasUl = document.getElementById('lista-de-compras');
    const limparMarcadosBtn = document.getElementById('limpar-marcados-btn');
    const removerCompradosBtn = document.getElementById('remover-comprados-btn');
    const filtroBtnsContainer = document.querySelector('.filtros-area');
    const anoAtualSpan = document.getElementById('ano-atual');

    let items = [];
    let filtroAtual = 'todos'; // pode ser 'todos', 'pendentes', 'comprados'

    // --- Funções de Persistência (Local Storage) ---
    function salvarItems() {
        localStorage.setItem('listaDeComprasItems', JSON.stringify(items));
    }

    function carregarItems() {
        const itemsSalvos = localStorage.getItem('listaDeComprasItems');
        if (itemsSalvos) {
            items = JSON.parse(itemsSalvos);
        } else {
            // Exemplo de itens iniciais se a lista estiver vazia (opcional)
            /*
            items = [
                { id: Date.now() + 1, nome: "Leite", comprado: false },
                { id: Date.now() + 2, nome: "Pão", comprado: true },
                { id: Date.now() + 3, nome: "Ovos", comprado: false }
            ];
            */
        }
    }

    // --- Funções de Renderização e Manipulação da Lista ---
    function renderizarItems() {
        listaDeComprasUl.innerHTML = ''; // Limpa a lista atual no DOM

        let itemsParaRenderizar = items;

        if (filtroAtual === 'pendentes') {
            itemsParaRenderizar = items.filter(item => !item.comprado);
        } else if (filtroAtual === 'comprados') {
            itemsParaRenderizar = items.filter(item => item.comprado);
        }

        if (itemsParaRenderizar.length === 0 && filtroAtual !== 'todos' && items.length > 0) {
            const liVazia = document.createElement('li');
            liVazia.textContent = `Nenhum item ${filtroAtual === 'pendentes' ? 'pendente' : 'comprado'}.`;
            liVazia.style.textAlign = 'center';
            liVazia.style.color = '#888';
            liVazia.style.padding = '10px 0';
            listaDeComprasUl.appendChild(liVazia);
        } else if (items.length === 0) {
             const liVazia = document.createElement('li');
            liVazia.textContent = 'Sua lista está vazia. Adicione itens acima!';
            liVazia.style.textAlign = 'center';
            liVazia.style.color = '#888';
            liVazia.style.padding = '20px 0';
            listaDeComprasUl.appendChild(liVazia);
        }

        itemsParaRenderizar.forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            if (item.comprado) {
                li.classList.add('comprado');
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('checkbox-item');
            checkbox.checked = item.comprado;
            checkbox.addEventListener('change', () => toggleComprado(item.id));

            const nomeSpan = document.createElement('span');
            nomeSpan.classList.add('nome-item');
            nomeSpan.textContent = item.nome;

            const removerBtn = document.createElement('button');
            removerBtn.classList.add('remover-item-btn');
            removerBtn.textContent = '🗑️'; // Ícone de lixeira
            removerBtn.addEventListener('click', () => removerItem(item.id));

            li.appendChild(checkbox);
            li.appendChild(nomeSpan);
            li.appendChild(removerBtn);
            listaDeComprasUl.appendChild(li);
        });
        atualizarBotoesFiltro();
    }

    function adicionarItem() {
        const nomeDoItem = novoItemInput.value.trim();
        if (nomeDoItem === '') {
            alert('Por favor, digite o nome do item.');
            return;
        }

        const novoItem = {
            id: Date.now(), // ID simples baseado no timestamp
            nome: nomeDoItem,
            comprado: false
        };

        items.push(novoItem);
        novoItemInput.value = ''; // Limpa o input
        salvarItems();
        renderizarItems();
        novoItemInput.focus(); // Volta o foco para o input
    }

    function toggleComprado(idDoItem) {
        items = items.map(item =>
            item.id === idDoItem ? { ...item, comprado: !item.comprado } : item
        );
        salvarItems();
        renderizarItems(); // Re-renderiza para aplicar classes e filtros
    }

    function removerItem(idDoItem) {
        // Confirmação antes de remover (opcional, mas recomendado)
        const itemParaRemover = items.find(item => item.id === idDoItem);
        if (itemParaRemover && confirm(`Tem certeza que deseja remover "${itemParaRemover.nome}" da lista base?`)) {
            items = items.filter(item => item.id !== idDoItem);
            salvarItems();
            renderizarItems();
        }
    }

    function limparItensMarcados() {
        if (items.every(item => !item.comprado)) {
            alert("Nenhum item marcado como comprado para desmarcar.");
            return;
        }
        if (confirm("Desmarcar todos os itens comprados para uma nova compra?")) {
            items = items.map(item => ({ ...item, comprado: false }));
            salvarItems();
            renderizarItems();
        }
    }

    function removerItensCompradosDaBase() {
        const itensComprados = items.filter(item => item.comprado);
        if (itensComprados.length === 0) {
            alert("Nenhum item marcado como comprado para remover.");
            return;
        }
        if (confirm(`Tem certeza que deseja remover permanentemente ${itensComprados.length} item(ns) marcado(s) da lista base?`)) {
            items = items.filter(item => !item.comprado);
            salvarItems();
            renderizarItems();
        }
    }

    function atualizarBotoesFiltro() {
        document.querySelectorAll('.filtro-btn').forEach(btn => {
            if (btn.dataset.filtro === filtroAtual) {
                btn.classList.add('filtro-ativo');
            } else {
                btn.classList.remove('filtro-ativo');
            }
        });
    }

    // --- Event Listeners ---
    adicionarItemBtn.addEventListener('click', adicionarItem);
    novoItemInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            adicionarItem();
        }
    });

    limparMarcadosBtn.addEventListener('click', limparItensMarcados);
    removerCompradosBtn.addEventListener('click', removerItensCompradosDaBase);

    filtroBtnsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('filtro-btn')) {
            filtroAtual = event.target.dataset.filtro;
            renderizarItems();
        }
    });

    // --- Inicialização ---
    if (anoAtualSpan) {
        anoAtualSpan.textContent = new Date().getFullYear();
    }
    carregarItems();
    renderizarItems();
    novoItemInput.focus();
});