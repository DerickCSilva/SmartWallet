// Modules
const express = require('express');
const router = express.Router();

// Functions
const formatMoney = require('../../functions/formatMoney')

// Models
const WishList = require('./WishList');

// GETS
router.get('/new/wish', (req, res) => {
    res.render('wishList/newWish'); // Renderiza a página de novo desejo
});

router.get('/edit/wish/:id', (req, res) => {
    let { id } = req.params; // Pegando o ID enviado na URL

    // Buscando na tabela de lista de desejos com base no ID
    WishList.findByPk(id).then(wish => {
        if (wish) { // Caso exista um item com esse ID
            res.render('wishList/editWish', {
                wish
            });
        } else { // Caso não exista
            res.redirect('/wishlist/page/1');
        }
    });
});

router.get('/wishlist/page/:num', (req, res) => {
    let { num } = req.params; // Pegando número enviado na URL
    let offset = 0;
    let limit = 7;

    // Definindo a partir de qual registro da tabela será feito a busca
    offset = isNaN(num) || num == 1 ? 0 : (parseInt(num) - 1) * limit;

    num = parseInt(num);

    WishList.findAndCountAll({
        limit,  // Trazer apenas limit registros
        offset,  // A partir de tal registro
        order: [
            ['id', 'desc'] // Ordenar pelo id de forma decrescente
        ]
    }).then(allWishes => {
        // Lógica para saber se tem próxima página
        let next = offset + limit >= allWishes.count ? false : true;
        allWishes = allWishes.rows;
        if (allWishes.length == 0) {
            return res.render('wishlist/wishlist', {
                noContent: true,
                num: false,
                next: false
            });
        }

        // Caso não tenha itens ou a página passada não for Number
        if (allWishes.length == 0 || isNaN(num)) {
            res.redirect('/wishlist/page/1');
        } else {
            WishList.sum('value').then(value => { // Somando a coluna "value" para retornar o total gasto 
                return res.render('wishlist/wishlist', {
                    noContent: false,
                    formatMoney,
                    allWishes,
                    value,
                    next,
                    num
                });
            });
        }
        
    });
});

// POSTS
router.post('/new/wish', (req, res) => {
    let { situation, degree, item, value, store } = req.body; // Pegando dados do form enviado

    WishList.create({ // Criando um novo item na tabela de lista de desejos
        situation,
        degree,
        item,
        value,
        store
    }).then(() => res.redirect('/wishlist/page/1'))
        .catch(err => res.send(err)); // Caso der erro
});

router.post('/update/wish', (req, res) => {
    let { id, situation, degree, item, value, store } = req.body; // Pegando dados do form enviado

    // Atualizando o item no id especifico
    WishList.update({
        id,
        situation,
        degree,
        item,
        value,
        store
    }, {
        where: { id }
    }).then(() => res.redirect('/wishlist/page/1'))
        .catch(err => res.send(err)); // Caso de erro
});

router.post('/delete/wish', (req, res) => {
    let { id } = req.body;

    if (id) { // Se existir ID
        if (!isNaN(id)) { // Se for número
            WishList.destroy({
                where: { id }
            }).then(() => {
                res.redirect('/wishlist/page/1');
            });
        } else { // Não for número
            res.redirect('/wishlist/page/1');
        }
    } else { // Se for null
        res.redirect('/wishlist/page/1');
    }
});

module.exports = router;