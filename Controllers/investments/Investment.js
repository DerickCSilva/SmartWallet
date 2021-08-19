const Sequelize = require('sequelize');
const connection = require('../../database/database');

const Investment = connection.define('investments', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Investment.sync({ force: false })
    .then(() => console.log('Tabela de investimentos criada!'))
    .catch(err => res.json(err));

module.exports = Investment;