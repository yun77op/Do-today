var express = require('express');
var app = module.exports = express.createServer();
var config = require('./config.json');

process.env.NODE_ENV = 'development';

var models = require('./models');
var env  = process.env.NODE_ENV;
var envConfig = config.environment[env];
var port = envConfig.port;

var base = require('./base');
var db = base.bootDB();
base.bootApplication(app, db);
base.bootRoutes(app, db);
base.bootErrorConfig(app);

app.listen(port, function () {
  console.log('Listening on ' + port + ' in ' + env + ' mode.');
});