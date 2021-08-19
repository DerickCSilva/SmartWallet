// Modules
const express = require('express');
const router = express.Router();
const { Op } = require("sequelize");

// Functions
const reducingNumber = require('../../functions/reducingNumber');
const formatMoney = require('../../functions/formatMoney');

// Models
const Record = require('../records/Record');
const Category = require('../categories/Category');

// GETS
router.get('/monthlyExpenses', (req, res) => {
    res.render('monthlyExpenses', { // Renderiza a página de gastos mensais
        justInput: true
    });
});

// POSTS
router.post('/monthlyExpenses', (req, res) => {
    let { year } = req.body; // Pegando o ano enviado na requisição
    let date = new Date();

    // Comparando se ano é maior igual que 2020 e menor que o ano atual + 1
    if (year >= 2020 && year < date.getFullYear() + 1) {
        // Formatando o início e o fim do ano enviado
        let startYear = `${year}-01-01`;
        let endYear = `${year}-12-31`;

        Record.findAll({ // Busca na tabela de registros
            where: {
                date: {                   // Onde a data for:
                    [Op.gte]: startYear,  // Maior igual que o começo do ano
                    [Op.lte]: endYear     // Menor igual que o fim do ano
                }
            },
            include: [{ model: Category }]
        }).then(allRecords => {
            // Criando um objeto para armazenar valores pelo mês
            let valuesByDate = {
                "01": ["0"],
                "02": ["0"],
                "03": ["0"],
                "04": ["0"],
                "05": ["0"],
                "06": ["0"],
                "07": ["0"],
                "08": ["0"],
                "09": ["0"],
                "10": ["0"],
                "11": ["0"],
                "12": ["0"]
            };

            let valuesNotFormatted = [];

            // Percorrendo todos registros para guardar os valores por mês
            let prices = allRecords.map(r => {
                let date = r.date.substr(5, 2); // Pegando apenas o mês
                const check = (title, content) => {
                    if (valuesByDate[title] !== undefined) { // Testa se a chave existe
                        if (r.category.type == 'gastos' && r.item !== 'Dinheiro Guardado' && (r.item != 'Vale-Refeição' && r.item != 'Supermercado')) // Se for gastos
                            valuesByDate[title].push(content);    // Adiciona um elemento no array
                    } else {
                        if (r.category.type == 'gastos' && r.item !== 'Dinheiro Guardado' && (r.item != 'Vale-Refeição' && r.item != 'Supermercado'))
                            valuesByDate[title] = [content];      // Se não existe, cria um array com um elemento
                    }
                };
                check(date, r.value);
            });

            // Reduzindo e formatando os valores por mês
            Object.keys(valuesByDate).forEach((item) => {
                valuesByDate[item] = reducingNumber(valuesByDate[item]);

                valuesNotFormatted.push(valuesByDate[item]);

                valuesByDate[item] = formatMoney(valuesByDate[item]);
            });

            // Reduzindo os valores mensais para formatar o valor gastos anual
            let annualExpenses = valuesNotFormatted.reduce((total, num) => total + num);
            
            // Formatando número para string moeda 
            annualExpenses = formatMoney(annualExpenses);

            res.render('monthlyExpenses', { // Renderizando a página com todas variáveis necessárias
                justInput: false,
                annualExpenses,
                valuesByDate,
                year
            });
        });

    } else { // Se for um ano diferente
        res.redirect('/monthlyExpenses');
    }
});

module.exports = router;