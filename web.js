var express = require('express'),
        ejs = require('ejs'),
     Oauth2 = require('./lib/oauth2'),
     config = require('./lib/config').config;

var app = express.createServer();


app.name = 'dotoday';
app.version = '0.1';

app.configure(function () {
  app.use(express.logger());
  app.use(express.static(__dirname + '/public'));
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.use(express.session({
    store: mongoStore(),
    secret: app.name + '_secret',
    cookie: {
      maxAge : config.server.cookie_maxAge
    }
  }));
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
  res.redirect(oauth2.getAuthorizeURL());
});

app.get('/callback', function (req, res) {
  var url = require('url').parse(req.url, true);
  var code = url.query.code;
  oauth2.getAccessToken(code, function (data) {
    req.session.userToken = JSON.stringify(data);
    res.redirect('/app');
  });
});

app.get('/logout', function (req, res) {
  
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