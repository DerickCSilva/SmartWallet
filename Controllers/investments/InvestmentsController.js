// Modules
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// Models
const Investment = require('./Investment');
const Percent = require('./Percent');
const Category = require('../categories/Category');
const Record = require('../records/Record');

// Functions
const getDate = require('../../functions/getDate');
const getMonth = require('../../functions/getMonth');
const getMonthYear = require('../../functions/getMonthYear');
const formatMoney = require('../../functions/formatMoney');
const creatArray = require('../../functions/creatArray');
const sumValues = require('../../functions/sumValues');

// GETS
router.get('/investments', (req, res) => {
    Category.findAll({ // Busca na tabela de categorias
        include: [{ model: Record }]
    }).then(categories => {
        // Criação de um objeto para guardar os valores gastos antes do investimento por mês
        let valuesByMonth = {}

        // Calculando o saldo que tem ainda antes do investimento do mês
        let totalBalance = categories.map(category => {
            if (category.type == 'receita') { // Separando por receita
                let revenue = category.records.map(r => {
                    if(r.item != 'Vale-Refeição') {
                        let key = `${category.type}-${r.date.slice(0, 7)}`;
                        creatArray(key, r.value, valuesByMonth);  // Cria um array com nome, valores, no objeto passado 
                    }
                });
            } else if (category.type == 'gastos' && category.pre_pos == 'pre') { // Separando por gastos pre (Antes do investimento)
                let pre_expenses = category.records.map(r => {
                    if (r.item != 'Supermercado') {
                        let key = `${category.type}-${r.date.slice(0, 7)}`;
                        creatArray(key, r.value, valuesByMonth); // Cria um array com nome, valores, no objeto passado
                    }
                });
            } else {
                return ["0"]
            }
        });

        // Reduzindo os valores do objeto de cima
        Object.keys(valuesByMonth).forEach((item) => {
            valuesByMonth[item] = valuesByMonth[item].map(v => {
                v = v.replace(',', '.');
                return parseFloat(v);
            });

            valuesByMonth[item] = valuesByMonth[item].reduce((total, num) => {
                return total + num;
            });
        });

        // Criação de um objeto para guardar o valor de receita e os valores dos gastos pre investimento
        let usedInInvestment = {}

        // Guardando receita e gastos pre no objeto de cima
        Object.keys(valuesByMonth).forEach((item) => {
            // O item pode ser 'receita-YYYY-MM'(length 15)  ou 'gastos-2021-02' (length 14)
            if (item.length >= 15) {
                let itemKey = item.slice(8, 15); // Irá pegar de 'receita-YYYY-MM' apenas 'YYYY-MM'
                creatArray(itemKey, valuesByMonth[item], usedInInvestment);
            } else {
                let itemKey = item.slice(7, 14); // Irá pegar de 'gastos-YYYY-MM' apenas 'YYYY-MM'
                creatArray(itemKey, valuesByMonth[item], usedInInvestment);
            }
        });

        // Reduzindo receita - gastos_pre para utilizar esse saldo nos investimentos
        Object.keys(usedInInvestment).forEach((item) => {
            usedInInvestment[item] = usedInInvestment[item].reduce((total, num) => {
                return total - num;
            });

            usedInInvestment[item] = parseFloat(usedInInvestment[item].toFixed(2)); // Limitando casas decimais
        });

        // Busca na tabela de porcentagens
        Percent.findAll({
            include: [{ model: Investment }]
        }).then(percents => {
            if (percents.length == 0) {
                return res.render('investment/investments', { // Renderizando a página com as variáveis necessárias
                    noContent: true,
                    formatMoney,
                    totalInvested: 0
                });
            }
            // Criação de um objeto para inicialmente separar o quanto sobrou de receita - gastos_pre de casa mês
            let percentsByMonth = {}

            // Colocando no objeto de cima o valor para investir
            Object.keys(usedInInvestment).forEach((item) => {
                creatArray(item, usedInInvestment[item], percentsByMonth);
            });

            // Percorrendo para formatar a porcentagem para futuro cálculo
            let something = percents.map(percent => {
                let name = percent.investment.name;
                let percentage = percent.percent;

                if (percentage.length > 1) {
                    percentage = '0.' + percentage;
                    percentage = parseFloat(percentage);
                } else {
                    percentage = '0.0' + percentage;
                    percentage = parseFloat(percentage);
                }

                // Separando porcentagem por investimentos no mês certo
                creatArray(percent.date, [percentage, name], percentsByMonth);
            });

            // Criando um objeto cópia para fazer manipulação diferente
            let copyPercentsByMonth = { ...percentsByMonth };

            // Calculando valor para investir * porcentagem de cada investimento
            Object.keys(percentsByMonth).forEach((item) => {
                if (typeof percentsByMonth[item][0] == 'number') { // Se o primeiro elemento for o valor para investir
                    percentsByMonth[item] = percentsByMonth[item].map(i => {
                        if (typeof i == 'object' && item) {
                            return parseFloat((percentsByMonth[item][0] * i[0]).toFixed(2));
                        } else {
                            return false;
                        }
                    });
                } else { // Se não for, deleta
                    delete percentsByMonth[item];
                }
            });

            // Criando um objeto cópia para fazer manipulação diferente
            let valuesByInvestment = {}

            // Percorrendo o objeto copiado para separar o valor total de cada investimento por mês
            Object.keys(copyPercentsByMonth).forEach((item) => {
                if (typeof copyPercentsByMonth[item][0] == 'number') { // Vendo se o primeiro valor do array é number
                    copyPercentsByMonth[item] = copyPercentsByMonth[item].map(i => {
                        if (typeof i == 'object') {
                            creatArray(i[1], [copyPercentsByMonth[item][0], i[0]], valuesByInvestment);
                        } else {
                            return false;
                        }
                    });
                } else {
                    delete copyPercentsByMonth[item];
                }
            });

            // Reduzindo e formatando os valores por investimento
            Object.keys(valuesByInvestment).forEach((item) => {
                valuesByInvestment[item] = valuesByInvestment[item].map(v => {
                    valuesByInvestment[item] = v.reduce((total, num) => {
                        return total * num;
                    });
                    return valuesByInvestment[item];
                });

                valuesByInvestment[item] = valuesByInvestment[item].reduce((total, num) => {
                    return total + num;
                });
                valuesByInvestment[item] = parseFloat(valuesByInvestment[item].toFixed(2));
            });

            // Pegando só os valores e deixando em um array
            valuesByInvestment = Object.values(valuesByInvestment);

            // Somando todos investimentos para ver quanto foi investido
            let totalInvested = valuesByInvestment.reduce((total, num) => {
                return total + num;
            });

            Investment.findAll().then(investments => {
                return res.render('investment/investments', { // Renderizando a página com as variáveis necessárias
                    noContent: false,
                    valuesByInvestment: [valuesByInvestment],
                    percentsByMonth,
                    investments,
                    formatMoney,
                    getMonthYear,
                    totalInvested
                });
            });

        });
    });

});

router.get('/new/investment', (req, res) => {
    res.render('investment/newInvestment'); // Renderizando a página de novos
});

router.get('/new/percent', (req, res) => {
    // Busca na tabela de investimentos
    Investment.findAll().then(investments => {
        res.render('investment/registerPercent', { // Renderizando a página de novos com as variáveis necessárias
            investments
        });
    });
});

router.get('/view/investment', (req, res) => {
    // Função que retorna qual é o mês que atual e as datas do início e o fim do mês atual
    let dates = getDate(new Date());
    let { startMonth, endMonth, monthString } = dates;

    // Cortando a data para pegar apenas o ano e o mês 'YYYY-MM'
    startMonth = startMonth.slice(0, 7);
    endMonth = endMonth.slice(0, 7);

    Percent.findAll({
        where: {
            date: {                   // Onde a data for:
                [Op.gte]: startMonth, // Maior igual que o começo do mês atual
                [Op.lte]: endMonth    // Menor igual que o final do mês atual 
            }
        },
        include: [{ model: Investment }]
    }).then(percents => {
        // Caso não tenha registros sobre as porcentagens
        if (percents.length == 0) {
            res.render('investment/investmentTable', {    // Renderizando a página de novos com as variáveis necessárias
                noRegisters: true,
                startMonth
            });
        } else { // Se tiver porcentagem
            Investment.findAll().then(investments => {
                res.render('investment/investmentTable', { // Renderizando a página de novos com as variáveis necessárias
                    noRegisters: false,
                    monthString,
                    percents,
                    startMonth,
                    investments
                });
            });
        }
    });
});

router.get('/edit/percent/:id', (req, res) => {
    let { id } = req.params; // Pegando ID na URL

    Percent.findAll({ // Busca na tabela de porcentagem
        where: { id },
        include: [{ model: Investment }]
    }).then(percent => {
        if (percent.length == 0) { // Se existir porcentagem com esse ID
            res.redirect('/view/investment');
        } else { // Se não existir
            Investment.findAll().then(investments => {
                res.render('investment/editPercent', { // Renderizando a página de novos com as variáveis necessárias
                    investments,
                    percent: percent[0]
                });
            });
        }
    });
});

router.get('/edit/investment/:id', (req, res) => {
    let { id } = req.params; // Pegando o ID da URL

    // Busca na tabela de investimento pelo id
    Investment.findByPk(id).then(investment => {
        if(investment) { // Se existir registro de investimento com esse ID
            res.render('investment/editInvestment', {
                investment
            });
        } else { // Se não existir
            res.redirect('/investments');
        }
    });
});

// POSTS
router.post('/new/investment', (req, res) => {
    let { investment } = req.body; // Pegando o nome enviado pelo form

    Investment.create({ // Registrando novo investimento
        name: investment
    }).then(() => res.redirect('/new/investment'))
        .catch(err => res.send(err)); // Caso de erro
});

router.post('/new/percent', (req, res) => {
    let { investment, date, percent } = req.body; // Pegando o nome enviado pelo form

    Percent.create({ // Criando nova porcentagem
        date,
        percent,
        investmentId: investment
    }).then(() => res.redirect('/new/percent'))
        .catch(err => res.send(err)); // Caso de erro
});

router.post('/view/investment', (req, res) => {
    let { month } = req.body; // Pegando a data enviada pelo form

    // Função que retorna qual é o mês em string que foi passado
    let dates = getMonth(month.slice(5, 7));
    let { monthString } = dates;

    Percent.findAll({
        where: {
            date: {                   // Onde a data for:
                [Op.gte]: month,      // Maior igual que o começo do mês atual
                [Op.lte]: month       // Menor igual que o final do mês atual 
            }
        },
        include: [{ model: Investment }]
    }).then(percents => {
        if (percents.length == 0) { // Caso não tenha registros sobre as porcentagens
            res.render('investment/investmentTable', {
                startMonth: false,
                noRegisters: true,
                month
            });
        } else { // Se tiver porcentagem
            Investment.findAll().then(investments => {
                res.render('investment/investmentTable', {
                    noRegisters: false,
                    startMonth: false,
                    monthString,
                    percents,
                    investments,
                    month
                });
            });
        }
    });
});

router.post('/update/percent', (req, res) => {
    let { id, investment, date, percent } = req.body; // Pega os dados enviado do form 

    Percent.update({ // Atualiza um percentual na tabela
        date,
        percent,
        investmentId: investment
    }, {
        where: { id }
    }).then(() => res.redirect('/view/investment'))
        .catch(err => res.send(err)); // Caso de erro    
});

router.post('/update/investment', (req, res) => {
    let { id, investment } = req.body; // Pega os dados enviado do form

    Investment.update({ // Atualiza o nome de um investimento na tabela
        name: investment
    }, {
        where: { id }
    }).then(() => res.redirect('/view/investment'))
        .catch(err => res.send(err)); // Caso de erro
});

router.post('/delete/percent', (req, res) => {
    let { id } = req.body; // Pega o id enviado do body

    if (id) { // Se existir ID
        if (!isNaN(id)) { // Se for número
            Percent.destroy({
                where: { id }
            }).then(() => {
                res.redirect('/view/investment');
            });
        } else { // Não for número
            res.redirect('/view/investment');
        }
    } else { // Se for null
        res.redirect('/view/investment');
    }
});

router.post('/delete/investment', (req, res) => {
    let { id } = req.body; // Pega o id enviado do body

    if (id) { // Se existir ID
        if (!isNaN(id)) { // Se for número
            Investment.destroy({
                where: { id }
            }).then(() => {
                res.redirect('/view/investment');
            });
        } else { // Não for número
            res.redirect('/view/investment');
        }
    } else { // Se for null
        res.redirect('/view/investment');
    }
});

module.exports = router;