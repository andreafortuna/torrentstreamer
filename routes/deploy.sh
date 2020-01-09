#!/bin/sh
heroku apps:create torrent2http
heroku addons:create heroku-postgresql:hobby-dev -a torrent2http

