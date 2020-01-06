var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', function (req, res) {
  //res.send('Got a POST request')
  res.render('stream', { title: 'Streaming...', "magnet": req.body.magnet });
})

module.exports = router;
