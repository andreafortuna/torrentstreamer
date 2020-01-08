var express = require('express');
var router = express.Router();
let fs = require("fs")
  
var WebTorrent = require('webtorrent-hybrid')

let client = new WebTorrent()


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/stream/:infohash', function(req, res, next) {
        var torrent = client.get(req.params.infohash);
  
        var file = torrent.files.find(function (file) {
          return file.name.toLowerCase().endsWith('.mp4')
        })
        
        console.log ("Streaming " + file.path)
        
        let range = req.headers.range;

        console.log(range);
        if(range)
        {
          //let err = new Error("Wrong range");
          //err.status = 416;
          //return next(err);
          var positions = range.replace(/bytes=/, "").split("-");
        } else {
          var positions = [0,10];
        }


        
        let start = parseInt(positions[0], 10);
        let file_size = file.length;
        let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
        let chunksize = (end - start) + 1;

        let head = {
          "Content-Range": "bytes " + start + "-" + end + "/" + file_size,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "video/mp4"
        }
        res.writeHead(206, head);
        
        let stream_position = {
          start: start,
          end: end
        }
        let stream = file.createReadStream(stream_position)
        stream.pipe(res);                
});

router.get('/view/:infohash', function(req, res, next) {
  var torrent = client.get(req.params.infohash);
  var file = torrent.files.find(function (file) {
    return file.name.toLowerCase().endsWith('.mp4')
  })
  if (!file) {
    console.log("unsupported file type")
    res.render('torrent_error', { message: 'Unsupported file type!'});
  } else {
    res.render('stream', { title: 'Express', "infohash": req.params.infohash });
  }
  
});


router.post('/', function (req, res) {
  //res.send('Got a POST request')


  var magnetURI = req.body.magnet
  
  check_torrent = client.get(magnetURI)

  if (check_torrent) {
    //res.render('stream', { title: 'Streaming...', "infohash": check_torrent.infoHash, "magnet" : req.body.magnet  });
    res.redirect("/view/" + check_torrent.infoHash)
  } else {

      client.add(magnetURI , function (torrent) {

      console.log(torrent.infoHash)
      res.redirect("/view/" + torrent.infoHash)
      torrent.on('done', function () {
        console.log('torrent download finished')
      })
    })

  }

})

module.exports = router;
