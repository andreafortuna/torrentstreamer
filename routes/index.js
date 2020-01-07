var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/stream/:infohash', function(req, res, next) {
  res.render('stream', { title: 'Express', "infohash": req.params.infohash });
});

router.post('/', function (req, res) {
  //res.send('Got a POST request')
  
  var WebTorrent = require('webtorrent-hybrid')

  var client = new WebTorrent()

  var magnetURI = req.body.magnet

  client.add(magnetURI, { announce: ['wss://tracker.openwebtorrent.com'
]}  , function (torrent) {

    console.log(torrent.infoHash)
    res.render('seed', { title: 'Streaming...', "infohash": torrent.infoHash, "magnet" : req.body.magnet  });
    torrent.on('done', function () {
      console.log('torrent download finished')
    })
  })

  
})

module.exports = router;
