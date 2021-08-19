// Modules
const express = require('express');
const router = express.Router();

// Models
const Category = require('./Category');

// GETS
router.get('/new/category', (req, res) => {
    res.render('categories/newCategory'); // Renderiza página principal de novas categorias
});

router.get('/edit/category/:id', (req, res) => {
    let { id } = req.params; // Pega o ID na URL passada

    // Busca na tabela de categorias pelo id
    Category.findByPk(id).then(category => {
        if (category) { // Se existir categoria com esse ID
            res.render('categories/editCategory', {
                category
            });
        } else { // Se não existir
            res.redirect('/categories/page/1')
        }
    });
});

router.get('/categories/page/:num', (req, res) => {
    let { num } = req.params; // Pegando número enviado na URL
    let offset = 0;
    let limit = 7; // Quantos registro sera puxado na busca que esse limit for colocado

    // Definindo a partir de qual registro da tabela será feito a busca
    offset = isNaN(num) || num == 1 ? 0 : (parseInt(num) - 1) * limit;

    num = parseInt(num);

    // Busca na tabela de categorias
    Category.findAndCountAll({
        limit,  // Trazer apenas limit registros
        offset  // A partir de tal registro
    }).then(categories => {
        // Lógica para saber se tem próxima página
        let next = offset + limit >= categories.count ? false : true;
        categories = categories.rows;

        // Caso não tenha registros ou a página passada não for Number
        if (categories.length == 0 || isNaN(num)) {
            res.redirect('/categories/page/1');
        } else {
            res.render('categories/categories', { // Renderizando a página com as variáveis necessárias
                categories,
                next,
                num
            });
        }
    });
});

// POSTS
router.post('/new/category', (req, res) => {
    let { name, type, pre_pos, } = req.body; // Pegando dados do form enviado

    Category.create({ // Criando a categoria na tabela
        name,
        type,
        pre_pos
    }).then(() => res.redirect('/categories/page/1'))
        .catch(err => res.send(err)); // Caso der erro
});

router.post('/update/category', (req, res) => {
    let { id, name, type, pre_pos } = req.body; // Pegando dados do form enviado

    Category.update({ // Atualizando o registro no id especifico
        name,
        type,
        pre_pos
    }, {
        where: { id }
    }).then(() => res.redirect('/categories/page/1'))
        .catch(err => res.send(err));
});

router.post('/delete/category', (req, res) => {
    let { id } = req.body; // Pegando o id capturado no body

    if (id) { // Se existir ID
        if (!isNaN(id)) { // Se for número
            Category.destroy({ // Apague
                where: { id }
            }).then(() => res.redirect('/categories/page/1'))
                .catch(err => res.json(err));
        } else { // Não for número
            res.redirect('/categories/page/1');
        }
    } else { // Se for null
        res.redirect('/categories/page/1');
    }
});

module.exports = router;