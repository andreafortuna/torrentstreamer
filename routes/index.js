var express = require('express');
var router = express.Router();

let fs = require("fs");

var WebTorrent = require('webtorrent');
var client = new WebTorrent();

var { Pool } = require('pg');
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});


var restore = async () => {
  // DB persistance support
    try {
      var sqlclient = await pool.connect()
      const result =  await sqlclient.query('SELECT * FROM torrents');
      result.rows.forEach((row) => {
        var magnetURI = row.url
        var check_torrent = client.get(magnetURI)
        if (!check_torrent) {
          client.add(magnetURI , function (torrent) {
          })
        }
      });
      sqlclient.release();

    } catch (err) {
      console.error(err);
    }
}

restore();

router.get('/', function(req, res, next) {
  //Torrentlist
  let torrents = client.torrents.reduce(function(array, data) {
		array.push({
      hash: data.infoHash,
      name: data.name,
      progress: Math.round(data.progress * 100)
		});
		return array;
	}, []);
  res.render('index', { title: 'Torrent Streamer Beta', torrentlist: torrents});
});

router.get('/stream/:infohash', function(req, res, next) {
        var torrent = client.get(req.params.infohash);
        var file = torrent.files.find(function (file) {
          return file.name.toLowerCase().endsWith('.mp4')
        })
        let range = req.headers.range;
        if(range)
        {
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
    res.render('torrent_error', { message: 'Unsupported file type!'});
  } else {
    res.render('stream', { title: file.name, "infohash": req.params.infohash });
  }
  
});

router.post('/', function (req, res) {
  var magnetURI = req.body.magnet
  var check_torrent = client.get(magnetURI)
  if (!check_torrent) {
    client.add(magnetURI , function (torrent) {
        try {
          pool.query("insert into torrents values ('" + magnetURI + "')");
        } catch (err) {
          console.error(err);
        }
    })
  }
  res.redirect("/")
})

module.exports = router;
