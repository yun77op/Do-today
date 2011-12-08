var express = require('express'),
        ejs = require('ejs'),
        url = require('url'),
     Oauth2 = require('./lib/oauth2'),
     config = require('./lib/config').config;

var app = express.createServer();

app.configure(function () {
  app.use(express.logger());
  app.use(express.static(__dirname + '/public'));
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');

});


var oauth = new Oauth2(config.oauth.client_id, config.oauth.client_secret);

function initRouter() {
  var routerMap = {
    '/': {
      title: 'Do today',
      template: 'login'
    },

    '/app': {
      title: 'Do today',
      template: 'app'
    }
  };
  var router;

  for (var path in routerMap) {
    router = routerMap[path];
    app.get(path, loadUser, function (req, res) {
      res.render(router.template, {
        locals: {
          title: router.title,
          currentUser: req.currentUser
        }
      });
    });
  }
}


app.get('/authorize', function (req, res) {
  oauth2.redirectUri = res.headers.protocol + res.headers.host + '/callback';
  res.redirect(oauth2.getRequestURL());
});

app.get('/callback', function (req, res) {
  var url = url.parse(req.url, true);
  
});

initRouter();
var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Listening on " + port);
});

function loadUser(req, res, next) {
  var user = req.session.userToken;
  if (user) {
    req.currentUser = JSON.parse(user);
    next();
  } else {
    res.redirect('home');
  }
}