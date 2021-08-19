// Modules
const express = require('express');
const router = express.Router();
const slugify = require('slugify');

// Models
const Item = require('./Item');
const Category = require('../categories/Category');

// GETS
router.get('/new/item', (req, res) => {
    // Busca na tabela de Categorias
    Category.findAll().then(categories => {
        res.render('items/newItem', { // Renderiza a página de criar novo item com a variável: Categories
            categories
        });
    });
});

router.get('/edit/item/:id', (req, res) => {
    let { id } = req.params; // Pegando o ID enviado na URL

    Item.findByPk(id).then(item => { // Busca um item pelo ID
        if (item) { // Caso tenha um item com esse ID
            Category.findAll().then(categories => {
                res.render('items/editItem', { // Renderiza a página de criar novo item com a variável: Categories
                    categories,
                    item
                });
            });
        } else { // Caso não tenha item com esse ID
            res.redirect('/items/page/1');
        }
    });
});

router.get('/items/page/:num', (req, res) => {
    let { num } = req.params; // Pegando o número enviado na URL
    let offset = 0;
    let limit = 10;

    // Definindo a partir de qual registro da tabela será feito a busca
    offset = isNaN(num) || num == 1 ? 0 : (parseInt(num) - 1) * limit;

    num = parseInt(num);

    Item.findAndCountAll({
        limit,              // Trazer apenas limit registros
        offset,             // A partir de tal registro
        order: [
            ['id', 'desc']  // Ordenar pelo id de forma decrescente
        ],
        include: [{ model: Category }]
    }).then(items => {
        // Lógica para saber se tem próxima página
        let next = offset + limit >= items.count ? false : true;
        items = items.rows;

        if (items.length == 0 || isNaN(num)) { // Caso não tenha itens ou a página passada não seja um número
            res.redirect('/items/page/1');
        } else {
            res.render('items/items', { // Renderiza a página de itens com as variáveis necessárias 
                items,
                next,
                num
            });
        }
    });
});

// POSTS
router.post('/new/item', (req, res) => {
    let { name, category } = req.body; // Pega os dados enviado do form 

    Item.create({ // Cria um item
        name,
        categoryId: category
    }).then(() => res.redirect('/items/page/1'))
        .catch(err => res.send(err)); // Caso de erro
});

router.post('/update/item', (req, res) => {
    let { id, name, category } = req.body; // Pega os dados enviado do form 

    Item.update({ // Atualiza um item na tabela
        name,
        categoryId: category
    }, {
        where: { id }
    }).then(() => res.redirect('/items/page/1'))
        .catch(err => res.send(err)); // Caso de erro
});

router.post('/delete/item', (req, res) => {
    let { id } = req.body; // Pega o id enviado do body

    if (id) { // Se existir ID
        if (!isNaN(id)) { // Se for número
            Item.destroy({ // Apagando pelo ID
                where: { id }
            }).then(() => {
                res.redirect('/items/page/1');
            });
        } else { // Não for número
            res.redirect('/items/page/1');
        }
    } else { // Se for null
        res.redirect('/items/page/1');
    }
});

module.exports = router;