const Sequelize = require('sequelize');
const connection = require('../../database/database');

const Category = connection.define('categories', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false
    },
    pre_pos: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Category.sync({ force: false })
    .then(() => console.log('Tabela de Categorias criada!'))
    .catch(err => res.json(err));

module.exports = Category;