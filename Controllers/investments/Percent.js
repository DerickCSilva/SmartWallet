const Sequelize = require('sequelize');
const connection = require('../../database/database');

// Models
const Investment = require('./Investment');

const Percent = connection.define('percents', {
    date: {
        type: Sequelize.STRING,
        allowNull: false
    },
    percent: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Investment.hasMany(Percent);
Percent.belongsTo(Investment);

Percent.sync({ force: false })
    .then(() => console.log('Tabela de percentual por investimento criada!'))
    .catch(err => res.json(err));

module.exports = Percent;