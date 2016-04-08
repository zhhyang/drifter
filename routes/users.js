var express = require('express');
var router = express.Router(),
    mongodb = require('../models/mongodb');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/:user', function(req, res, next) {
  mongodb.getAll(req.params.user,function (result) {
    res.json(result);
  })
});


module.exports = router;
