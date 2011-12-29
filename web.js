var express = require('express');
var app = express.createServer();

var config = require('./lib/config').config;
var models = require('./lib/models');

var env  = process.env.NODE_ENV || 'development';
var port = process.env.PORT || 8888;
var envConfig = config[environment][env];

var db;
var mongoose = require('mongoose');
models.defineModels(mongoose, function() {
  db = mongoose.connect(
    envConfig.db.host,
    envConfig.db.database,
    envConfig.db.port
  );
});

var boot = require('./boot');
boot.bootApplication(app, db);

app.listen(port, function () {
  console.log('Listening on ' + port+ ' in ' + env + 'mode.');
});