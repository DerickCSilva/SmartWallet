const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database/database');

// Router
const IndexController = require('./Controllers/IndexController');
const CategoryController = require('./Controllers/categories/CategoriesController');
const ItemController = require('./Controllers/items/ItemsController');
const RecordController = require('./Controllers/records/RecordsController');
const MonthlyController = require('./Controllers/monthly/MonthlyController');
const InvestmentController = require('./Controllers/investments/InvestmentsController');
const WishListController = require('./Controllers/wishList/WishListController');
const BalanceController = require('./Controllers/balance/BalanceController');
const PicPayController = require('./Controllers/picpay/PicPayController');

// Models
const Category = require('./Controllers/categories/Category');
const Item = require('./Controllers/items/Item');
const Record = require('./Controllers/records/Record');
const WishList = require('./Controllers/wishList/WishList');
const Investment = require('./Controllers/investments/Investment');
const Percent = require('./Controllers/investments/Percent');
const PicPay = require('./Controllers/picpay/PicPay');

// View Engine
app.set('view engine', 'ejs');

// Static Files
app.use(express.static('public'));

// Body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Connection with database
connection
    .authenticate()
    .then(() => console.log('Connection made successfuly!'))
    .catch(err => console.log(err));

// Using Routes
app.use('/', IndexController);
app.use('/', CategoryController);
app.use('/', ItemController);
app.use('/', RecordController);
app.use('/', MonthlyController);
app.use('/', InvestmentController);
app.use('/', WishListController);
app.use('/', BalanceController);
app.use('/', PicPayController);

// Port
app.listen(3031, () => console.log('Backend is running on port 3031'));