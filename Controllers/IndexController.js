// Modules
const express = require('express');
const router = express.Router();
const sequelize = require('sequelize');
const { Op } = require('sequelize');

// Functions
const getDate = require('../functions/getDate');
const formatDate = require('../functions/formatDate');
const formatMoney = require('../functions/formatMoney');
const reducingNumber = require('../functions/reducingNumber');

// Models
const Record = require('./records/Record');
const Category = require('./categories/Category');

router.get('/page/:num', (req, res) => {
    let { num } = req.params; // Pegando número enviado na URL
    let offset = 0;
    let limit = 10;

    // Definindo a partir de qual registro da tabela será feito a busca
    offset = isNaN(num) || num == 1 ? 0 : (parseInt(num) - 1) * limit;

    num = parseInt(num);

    // Função que retorna o início e o fim do mês atual
    let dates = getDate(new Date());
    let { startMonth, endMonth } = dates;

    if (num != 0) {
        Record.findAndCountAll({
            where: {
                date: {                   // Onde a data for:
                    [Op.gte]: startMonth, // Maior igual que o começo do mês atual
                    [Op.lte]: endMonth    // Menor igual que o final do mês atual 
                }
            },
            limit,                        // Trazer apenas limit registros
            offset,                       // A partir de tal registro
            order: [
                ['id', 'desc']            // Ordenar pelo id de forma decrescente
            ],
            include: [{ model: Category }]
        }).then(allRecords => {
            // Lógica para saber se tem próxima página
            let next = (offset + limit >= allRecords.count) || isNaN(num) ? false : true;
            allRecords = allRecords.rows;

            // Caso não tenha registros ou a página passada não for Number
            if (isNaN(num)) {
                return res.redirect('/page/1');
            } else if (allRecords.length == 0) {
                return res.render('index', {
                    msg: true,
                    num: 1,
                    next,
                    formatDate,
                    startMonth,
                    endMonth,
                    allRecords
                });
            }

            Category.findAll({
                include: [{ model: Record }]
            }).then(categories => {
                // Pegando valor de cada registro se estiver dentro da data certa
                let allValues = categories.map(category => {
                    let record = category.records.map(r => { // Valores de cada categoria
                        if (r.date >= startMonth && r.date <= endMonth && (r.item != 'Vale-Refeição' && r.item != 'Supermercado')) {
                            return r.value;
                        } else {
                            return "0"
                        }
                    });
                    return record;
                });

                // Reduzindo um array de números para um valor só
                let values = allValues.map(record => reducingNumber(record));

                // Formatando os valores para string de moeda
                values = values.map(v => {
                    if (typeof v == 'number') {
                        return formatMoney(v);
                    } else {
                        v = 'Nenhum valor registrado';
                        return v;
                    }
                });

                // Renderizando a página html com todas variáveis necessárias
                return res.render('index', {
                    msg: false,
                    allRecordsByItem: false,
                    agroup: false,
                    post: false,
                    startMonth,
                    endMonth,
                    formatMoney,
                    formatDate,
                    allRecords,
                    categories,
                    values,
                    num,
                    next
                });
            });
        });
    } else {
        res.redirect('/page/1')
    }
});

router.post('/page/:num', (req, res) => {
    let { initial_date, final_date, agroup } = req.body; // Pegando dados do form enviado
    let { num } = req.params; // Pegando número enviado na URL
    let offset = 0;
    let limit = 10;

    // Definindo a partir de qual registro da tabela será feito a busca
    offset = isNaN(num) || num == 1 ? 0 : (parseInt(num) - 1) * limit;

    num = parseInt(num);

    if (num != 0) {
        Record.findAndCountAll({
            where: {
                date: {                     // Onde a data for:
                    [Op.gte]: initial_date, // Maior igual que a data enviada
                    [Op.lte]: final_date    // Menor igual que a data enviada
                }
            },
            limit,                          // Trazer apenas limit registros
            offset,                         // A partir de tal registro
            order: [
                ['id', 'desc']              // Ordenar pelo id de forma decrescente
            ],
            include: [{ model: Category }]
        }).then(allRecords => {
            // Lógica para saber se tem próxima página
            let next = offset + limit >= allRecords.count ? false : true;
            allRecords = allRecords.rows;

            // Caso não tenha registros ou a página passada não for Number
            if (isNaN(num)) {
                return res.redirect('/page/1');
            } else if (allRecords.length == 0) {
                return res.render('index', {
                    msg: true,
                    startMonth: false,
                    endMonth: false,
                    num: 1,
                    formatDate,
                    initial_date,
                    final_date,
                    next
                });
            }

            Category.findAll({
                include: [{ model: Record }]
            }).then(categories => {
                // Pegando valor de cada registro se estiver dentro da data certa
                let allValues = categories.map(category => {
                    let record = category.records.map(r => { // Valores de cada categoria
                        if (r.date >= initial_date && r.date <= final_date && (r.item != 'Vale-Refeição' && r.item != 'Supermercado')) {
                            return r.value;
                        } else {
                            return "0"
                        }
                    });
                    return record;
                });

                // Reduzindo um array de números para um valor só
                let values = allValues.map(record => reducingNumber(record));

                // Formatando os valores para string de moeda
                values = values.map(v => {
                    if (typeof v == 'number') {
                        return formatMoney(v);
                    } else {
                        v = 'Nenhum valor registrado';
                        return v;
                    }
                });

                if (agroup == 'yes') {
                    Record.findAll({
                        where: {
                            date: {                     // Onde a data for:
                                [Op.gte]: initial_date, // Maior igual que o começo do mês atual
                                [Op.lte]: final_date    // Menor igual que o final do mês atual 
                            }
                        },
                        limit,                          // Trazer apenas limit registros
                        offset,                         // A partir de tal registro
                        group: ['item'],                // Agrupar por item
                        attributes: [                   // Pegue as colunas
                            'id',                       // ID
                            'item',                     // Item
                            'date',                     // Data
                            [sequelize.fn('sum', sequelize.col('value')), 'value'] // Some a coluna value
                        ],
                        include: [{ model: Category }]
                    }).then(allRecordsByItem => {
                        // Lógica para saber se tem próxima página
                        let next = offset + limit >= allRecordsByItem.length ? false : true;

                        return res.render('index', { // Renderizando a página html com todas variáveis necessárias
                            msg: false,
                            startMonth: false,
                            endMonth: false,
                            agroup: 'yes',
                            formatDate,
                            initial_date,
                            final_date,
                            formatMoney,
                            allRecordsByItem,
                            categories,
                            values,
                            num,
                            next,
                        });
                    });
                } else {
                    return res.render('index', { // Renderizando a página html com todas variáveis necessárias
                        msg: false,
                        startMonth: false,
                        allRecordsByItem: false,
                        agroup: false,
                        endMonth: false,
                        post: true,
                        formatDate,
                        initial_date,
                        final_date,
                        formatMoney,
                        allRecords,
                        categories,
                        values,
                        num,
                        next
                    });
                }
            });
        });
    } else {
        // Redirecionando o usuário
        res.redirect('/page/1')
    }
});

module.exports = router;