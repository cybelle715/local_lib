var express = require('express');
var router = express.Router();
const book_controller = require('../controllers/bookController');

/* GET home page. */

router.get('/', book_controller.index);

module.exports = router;
