var express = require('express');
var app = express.createServer();

app.configure(function () {
	app.use(express.logger());
	app.use(express.static(__dirname + '/public'));
});

app.get('/', function (request, response) {
	response.redirect('/index.html');
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Listening on " + port);
});