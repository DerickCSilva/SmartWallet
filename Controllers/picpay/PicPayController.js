const express = require('express');
const router = express.Router();

// Models
const PicPay = require('./PicPay');

// POSTS
router.post('/new/gains', (req, res) => {
    let { gains } = req.body; // Pegando o dado de ganhos enviado pelo form

    PicPay.create({ // Criando mais um registro de ganhos no PicPay
        value: gains
    }).then(() => res.redirect('/total/balance'))
        .catch(err => res.json(err));
});

module.exports = router;