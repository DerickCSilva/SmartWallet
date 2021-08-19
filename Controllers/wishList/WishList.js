const Sequelize = require('sequelize');
const connection = require('../../database/database');

const WishList = connection.define('wishlist', {
    situation: {
        type: Sequelize.STRING,
        allowNull: false
    },
    degree: {
        type: Sequelize.STRING,
        allowNull: false
    },
    item: {
        type: Sequelize.STRING,
        allowNull: false
    },
    value: {
        type: Sequelize.STRING,
        allowNull: false
    },
    store: {
        type: Sequelize.STRING
    }
});

WishList.sync({ force: false })
    .then(() => console.log('Tabela de lista de desejos criada!'))
    .catch(err => res.json(err));

module.exports = WishList;