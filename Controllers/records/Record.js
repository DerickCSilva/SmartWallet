const Sequelize = require('sequelize');
const connection = require('../../database/database');
const Category = require('../categories/Category');

const Record = connection.define('records', {
    item: {
        type: Sequelize.STRING,
        allowNull: false
    },
    value: {
        type: Sequelize.STRING,
        allowNull: false
    },
    desc: {
        type: Sequelize.STRING,
        allowNull: false
    },
    date: {
        type: Sequelize.DATEONLY,
        allowNull: false
    }
});

Category.hasMany(Record);
Record.belongsTo(Category);

Record.sync({ force: false })
    .then(() => console.log('Tabela de Registros criada!'))
    .catch(err => res.json(err));

module.exports = Record;