// Modules
const express = require('express');
const router = express.Router();

// Models
const Category = require('../categories/Category');
const Record = require('../records/Record');
const Percent = require('../investments/Percent');
const Investment = require('../investments/Investment');
const PicPay = require('../picpay/PicPay');

// Functions
const creatArray = require('../../functions/creatArray');
const formatMoney = require('../../functions/formatMoney');
const reducingArray = require('../../functions/reducingArray');
const sumValues = require('../../functions/sumValues');
const reducingNumber = require('../../functions/reducingNumber');
const subValues = require('../../functions/subValues');
const multArray = require('../../functions/multArray');
const connection = require('../../database/database');

// GETS
router.get('/total/balance', (req, res) => {
    // Busca na tabela de categorias
    Category.findAll({
        include: [{ model: Record }]
    }).then(categories => {
        if (categories.length == 0) {
            res.render('balance/totalBalance', {
                noContent: true
            });
        }
        // Pegando o valor do vale refeição
        let mealTicket = categories.map(category => {
            let money = category.records.map(r => {                              // Separando por:
                if (category.type == 'receita' && r.item == 'Vale-Refeição')     // Vale-refeição recebido
                    return parseFloat(r.value);
                else if (r.item == 'Supermercado')                               // Gatos na compra do mês
                    return -parseFloat(r.value);
                else if (category.type == 'gastos' && r.item == 'Vale-Refeição') // Gastos durante o mês 
                    return -parseFloat(r.value);
                else
                    return 0;
            });
            return money;
        });

        // Reduzindo um array de array para um único array
        mealTicket = mealTicket.map(m => reducingArray(m));

        // Somando e formatando o array reduzido acima
        mealTicket = sumValues(mealTicket)

        // Pegando o valor do dinheiro guardado
        let moneySaved = categories.map(category => {
            if (category.pre_pos === 'pos' && category.name == 'Gastos Extras') {
                let money = category.records.map(r => {
                    if (r.item == 'Dinheiro Guardado')
                        return parseFloat(r.value);
                    else
                        return 0;
                });
                return money;
            } else {
                return false;
            }
        });

        // Reduzindo um array de array para um único array
        moneySaved = moneySaved.map(m => {
            if (m) 
                return reducingArray(m);
            else
                return 0;
        });

        // Somando e formatando o array reduzido acima
        moneySaved = sumValues(moneySaved)

        // Criação de um objeto para guardar os valores gastos antes do investimento por mês
        let valuesByMonth = {}

        // Criação de um objeto para guardar os gastos pós investimentos
        let valuesPosInvestment = {}

        // Percorrendo as categorias e separando valores pré e pós investimentos
        let totalBalance = categories.map(category => {
            if (category.type == 'receita') {   // Separando por receita
                let revenue = category.records.map(r => {
                    if (r.item != 'Vale-Refeição') {
                        let key = `${category.type}-${r.date.slice(0, 7)}`;
                        creatArray(key, r.value, valuesByMonth);  // Cria um array com nome, valores, no objeto passado 
                    }
                });
            } else if (category.type == 'gastos' && category.pre_pos == 'pre') { // Separando por gastos pre (Antes do investimento)
                let pre_expenses = category.records.map(r => {
                    if (r.item != 'Supermercado') {
                        let key = `${category.pre_pos}-${r.date.slice(0, 7)}`;
                        creatArray(key, r.value, valuesByMonth); // Cria um array com nome, valores, no objeto passado
                    }
                });
            } else if (category.type == 'gastos' && category.pre_pos == 'pos') { // Separando por gastos pre (Antes do investimento)
                let pos_expenses = category.records.map(r => {
                    if (r.item != 'Vale-Refeição') {
                        let key = `${category.pre_pos}-${r.date.slice(0, 7)}`;
                        creatArray(key, r.value, valuesPosInvestment); // Cria um array com nome, valores, no objeto passado
                    }
                });
            } else {
                return ["0"]
            }
        });

        // Reduzindo os valores mensais
        Object.keys(valuesByMonth).forEach((item) => {
            valuesByMonth[item] = reducingNumber(valuesByMonth[item]);
        });

        // Criação de um objeto para guardar a receita e gastos pre investimento
        let usedInInvestment = {}

        // Guardando receita e gastos pre investimento no objeto de cima
        Object.keys(valuesByMonth).forEach((item) => {
            // O item pode ser 'receita-YYYY-MM'(length 15)  ou 'pre-YYYY-MM' (length 14)
            if (item.length >= 15) {
                let itemKey = item.slice(8, 15); // Irá pegar de 'receita-YYYY-MM' apenas 'YYYY-MM'
                creatArray(itemKey, valuesByMonth[item], usedInInvestment);
            } else {
                let itemKey = item.slice(4, 14); // Irá pegar de 'pos-YYYY-MM' 'pre-YYYY-MM' apenas 'YYYY-MM'
                creatArray(itemKey, valuesByMonth[item], usedInInvestment);
            }
        });

        // Criando uma para fazer manipulação de forma diferente
        let copyUsedInInvestment = { ...usedInInvestment }

        // Reduzindo receita - gastos_pre para utilizar esse saldo nos investimentos
        Object.keys(usedInInvestment).forEach((item) => {
            usedInInvestment[item] = subValues(usedInInvestment[item])
        });

        Percent.findAll({
            include: [{ model: Investment }]
        }).then(percents => {
            // Criação de um objeto para inicialmente separar o quanto sobrou de receita - gastos_pre de casa mês
            let percentsByMonth = {}

            // Separando valores para investir por mês
            Object.keys(usedInInvestment).forEach((item) => {
                creatArray(item, usedInInvestment[item], percentsByMonth);
            });

            // Percorrendo para formatar a porcentagem para futuro cálculo
            let something = percents.map(percent => {
                let name = percent.investment.name;
                let percentage = percent.percent;

                if (percentage.length > 1) { // Maior que 10
                    percentage = '0.' + percentage;
                    percentage = parseFloat(percentage);
                } else { // Menor que 10
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
            let investmentByMonth = {}

            // Separando o valor total de cada investimento por mês
            Object.keys(percentsByMonth).forEach((item) => {
                percentsByMonth[item] = percentsByMonth[item].map(i => {
                    if (i) {
                        creatArray(item, i, investmentByMonth);
                    } else {
                        delete i;
                    }
                });
            });

            Object.keys(investmentByMonth).forEach((item) => {
                investmentByMonth[item] = sumValues(investmentByMonth[item]);
                creatArray(item, investmentByMonth[item], copyUsedInInvestment);
            });

            Object.keys(copyUsedInInvestment).forEach((item) => {
                copyUsedInInvestment[item] = copyUsedInInvestment[item].reduce((total, num) => {
                    return total - num;
                });

                copyUsedInInvestment[item] = [parseFloat(copyUsedInInvestment[item].toFixed(2))]; // Limitando casas decimais
            });
            
            // Reduzindo e formatando gastos pos por mês
            Object.keys(valuesPosInvestment).forEach((item) => {
                valuesPosInvestment[item] = valuesPosInvestment[item].map(v => {
                    v = v.replace(',', '.');
                    return parseFloat(v);
                });

                valuesPosInvestment[item] = reducingArray(valuesPosInvestment[item]);

                let itemKey = item.slice(4, 11);
                creatArray(itemKey, valuesPosInvestment[item], copyUsedInInvestment);
            });
            
            // Reduzindo para saber quanto sobrou de cada mês
            Object.keys(copyUsedInInvestment).forEach((item) => {
                copyUsedInInvestment[item] = subValues(copyUsedInInvestment[item]);
            });

            // Pegando apenas os valores de quanto sobrou por mês
            copyUsedInInvestment = Object.values(copyUsedInInvestment);

            // Somando e formatando os valores reduzido acima
            let valueForUse = sumValues(copyUsedInInvestment);

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
                // Multiplicando o valor do investimento pela porcentagem
                valuesByInvestment[item] = multArray(valuesByInvestment[item]);

                // Somando
                valuesByInvestment[item] = sumValues(valuesByInvestment[item])
            });

            // Pegando só os valores e deixando em um array
            valuesByInvestment = Object.values(valuesByInvestment);

            // Somando todos investimentos para ver quanto foi investido
            let totalInvested = sumValues(valuesByInvestment);

            // Busca e somando valores pelos values na tabela do PicPay
            PicPay.findAll().then(totalPicPay => {
                // Pegando os valores registrados
                let values = totalPicPay.map(v => v.value);

                // Copiando o array de valores para manipular de forma diferente
                let query = values;

                // Adicionar o símbolo de '+' para pesquisa no google no front  
                query = query.map(v => {
                    v = v + '+%2B+';
                    return v;
                });

                query = query.toString(); // Transformando o array em string
                query = query.replace(/,/g, ''); // Substituindo vírgula por espaço vazio
                query = query.replace(/\./g, ','); // Substituindo ponto por vírgula
                query = query.substring(0, query.length - 5); // Tirando o último símbolo de '+' da string

                // Transformando os valores de string para number
                values = values.map(v => {
                    return parseFloat(v);
                });

                // Reduzindo o array somando
                values = values.reduce((total, num) => {
                    return total + num;
                });

                return res.render('balance/totalBalance', { // Renderizando a página principal com as variáveis necessárias 
                    noContent: false,
                    valueForUse,
                    moneySaved,
                    totalInvested,
                    values,
                    query,
                    mealTicket,
                    formatMoney,
                });
            });
        });
    });
});

module.exports = router;