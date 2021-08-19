// Modules
const express = require('express');
const router = express.Router();
const Record = require('./Record');

// Models
const Item = require('../items/Item');
const Category = require('../categories/Category');

// GETS
router.get('/new/record', (req, res) => {
    // Buscando as categorias
    Category.findAll({
        include: [{ model: Item }]
    }).then(categories => {
        // Caso não tenha categorias
        if (categories.length == 0) {
            return res.render('records/newRecord', {
                ids: false,
                allItems: false,
                noCategory: true
            });
        }

        // Pegando os nomes dos itens relacionado com cada categoria
        let items = categories.map(category => {
            let itemsName = category.items.map(item => item.name.toString());
            return itemsName;
        });

        let allItems = {};

        // Separa itens por categoria
        for (let i = 0; i < items.length; ++i) {
            allItems[i] = items[i];
        }

        // Pegando o id de cada categoria
        let ids = categories.map(category => category.id);

        return res.render('records/newRecord', { // Renderiza a página de novos com as variáveis necessárias
            noCategory: false,
            allItems: JSON.stringify(allItems),
            ids,
            categories
        });
    });
});

router.get('/edit/record/:id', (req, res) => {
    let { id } = req.params; // Pegando número enviado na URL

    Category.findAll({ // Busca na tabela de categorias
        include: [{ model: Item }]
    }).then(categories => {
        // Caso não tenha categoria
        if (categories.length == 0) {
            return res.redirect('/page/1');
        }

        // Pegando os nomes dos itens relacionado com cada categoria
        let items = categories.map(category => {
            let itemsName = category.items.map(item => item.name.toString());
            return itemsName;
        });

        let allItems = {};
        
        // Separa itens por categoria
        for (let i = 0; i < items.length; ++i) {
            allItems[i] = items[i];
        }

        // Pegando o id de cada categoria
        let ids = categories.map(category => category.id);

        Record.findByPk(id).then(record => {  // Busca na tabela de registros com base em um ID
            if (record) { // Se existir o id
                return res.render('records/editRecord', { // Renderiza a página de edit com as variáveis necessárias
                    noCategory: false,
                    allItems: JSON.stringify(allItems),
                    ids,
                    categories,
                    record
                });
            } else { // id Null
                res.redirect('/page/1');
            }
        });
    });
});

// POSTS
router.post('/new/record', (req, res) => {
    let { category, item, value, desc, date_record } = req.body; // Pegando os dados enviado do form
    category = parseInt(category) + 1;

    Record.create({ // Criando uma nova categoria
        categoryId: category,
        date: date_record,
        item,
        value,
        desc
    }).then(() => res.redirect('record'))
        .catch(err => res.send(err)); // Caso de erro
});

router.post('/update/record', (req, res) => {
    let { id, category, item, value, desc, date_record } = req.body; // Pegando os dados enviado do form
    category = parseInt(category) + 1;

    Record.update({ // Atualizando um registro
        date: date_record,
        categoryId: category,
        item,
        value,
        desc
    }, {
        where: { id }
    }).then(() => res.redirect('/page/1'))
        .catch(err => res.send(err)); // Caso de erro
});

router.post('/delete/record', (req, res) => {
    let { id } = req.body; // Pegando os dados do corpo da request

    if (id) { // Se existir o id
        if (!isNaN(id)) { // Se o id for number
            Record.destroy({ // Apagar um registro com base no id
                where: { id }
            }).then(() => res.redirect('/page/1'))
                .catch(err => res.send(err)); // Caso de erro
        } else { // Se não for número
            res.redirect('/page/1');
        }
    } else { // Se o id for Null
        res.redirect('/page/1');
    }
});

module.exports = router;