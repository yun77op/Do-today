var express = require('express');
var app = module.exports = express();

var base = require('./base');
var db = base.bootDB(app);
base.bootApplication(app, db);
base.bootRoutes(app, db);
base.bootErrorConfig(app);

var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log('Listening on ' + port);
});