const Sequelize = require('sequelize');
const connection = require('../../database/database');

const PicPay = connection.define('picpay', {
    value: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

PicPay.sync({ force: false })
    .then(() => console.log('Tabela de registros do PicPay criada!'))
    .catch(err => res.json(err));

module.exports = PicPay;