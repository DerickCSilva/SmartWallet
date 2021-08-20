// Todas as páginas
const showNews = (news) => { // Mostra a lista de novos
    news.style.display = 'block';
}

const ocultNews = (news) => { // Oculta a lista de novos
    news.style.display = 'none';
}

// Páginas: newCategory.ejs e editCategory.ejs
const byType = () => { // Função que oculta o select de Pré/Pós investimento dependendo da seleção do tipo
    let type = document.getElementById('type');
    let valueType = type.options[type.selectedIndex].value;

    let pre_pos = document.getElementById('pre_pos');
    let valuePos = pre_pos.options[2];

    if (valueType == 'receita') {
        valuePos.setAttribute('hidden', 'hidden');
    } else {
        valuePos.removeAttribute('hidden');
    }
}

// Páginas: editRecord.ejs e newRecord.ejs
const showItemsByCategory = (items, ...categories) => {  // Função que mostra os itens da categoria selecionada
    let numberIndex = categories.map(number => number - 1);
    let categoryId = document.getElementById('category').value;
    let select = document.getElementById('item');
    let no = document.getElementById('no');
    
    if(categoryId !== '') {
        let length = select.options.length;
        for (i = length - 1; i >= 0; i--) {
            select.options[i+1] = null;
        }
    
        items = items[categoryId];
    
        items.map(item => {
            let option = new Option(item, item);
            select.add(option);
        });

        if(items.length === 0) {
            no.style.display = 'block';
            select.style.display = 'none';
        } else {
            no.style.display = 'none';
            select.style.display = 'block';
        }
    }
}

// Função para confirmar um DELETE de algum item
const confirmDeletion = (event, form) => {
    event.preventDefault();
    var decision = confirm('Tem certeza que deseja deletar?');

    if(decision) {
        form.submit();
    }
}