var express = require('express');
var app = express.createServer();
var config = require('./config.json');

process.env.NODE_ENV = 'development';

var models = require('./models');
var env  = process.env.NODE_ENV;
var envConfig = config.environment[env];
var port = envConfig.port;
var db = require('mongoose').connect(
  'mongodb://' + envConfig.db.user + ':' + envConfig.db.pass + '@' +
  envConfig.db.host + ':' + envConfig.db.port + '/' + envConfig.db.database
);

var boot = require('./boot');
boot.bootApplication(app, db);
boot.bootRoutes(app, db);
boot.bootErrorConfig(app);

app.listen(port, function () {
  console.log('Listening on ' + port+ ' in ' + env + ' mode.');
});