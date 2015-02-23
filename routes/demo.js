var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.render('demo', { title: 'Bass tuner - Oscillator demo' });
});

module.exports = router;
