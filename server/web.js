var express = require('express');
var app = express.createServer();

var config = require('./config');
var models = require('./models');

var env  = process.env.NODE_ENV || 'development';
var port = process.env.PORT || 8888;
var envConfig = config.environment[env];

var db = require('mongoose').connect(
  envConfig.db.host,
  envConfig.db.database,
  envConfig.db.port
);

var boot = require('./boot');
boot.bootApplication(app, db);
boot.bootRoutes(app, db);
boot.bootErrorConfig(app);

app.listen(port, function () {
  console.log('Listening on ' + port+ ' in ' + env + ' mode.');
});