const Sequelize = require('sequelize');
const connection = require('../../database/database');

// Models
const Category = require('../categories/Category');

const Item = connection.define('items', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Category.hasMany(Item);
Item.belongsTo(Category);

Item.sync({ force: false })
    .then(() => console.log('Tabela de Itens criada!'))
    .catch(err => res.json(err));

module.exports = Item;