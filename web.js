var express = require('express'),
        ejs = require('ejs'),
 mongoStore = require('connect-mongodb'),
     Oauth2 = require('./lib/oauth2').Oauth2,
     config = require('./lib/config').config;

var app = express.createServer();

app.configure('development', function() {
  app.set('db-uri', 'mongodb://localhost/dotoday-development');
  app.use(express.errorHandler({ dumpExceptions: true }));
});

app.configure('production', function() {
  app.set('db-uri', 'mongodb://localhost/dotoday-production');
});

app.configure(function () {
  app.use(express.logger());
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.use(express.cookieParser());
  app.use(express.session({
    store: mongoStore(app.set('db-uri')),
    secret: 'topsecret',
    cookie: {
      maxAge : config.server.cookie_maxAge
    }
  }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true }));
});

var oauth = new Oauth2(config.oauth.client_id, config.oauth.client_secret);

app.get('/', loadUser, function (req, res) {
  if (req.currentUser) {
    res.redirect('/app');
  } else {
    res.render('login', {
      locals: {
        title: '登陆Dotoday'
      }
    });
  }
});

app.get('/app', loadUser, function (req, res) {
  var currentUser = req.currentUser;
  res.render('app', {
    locals: {
      title: currentUser.name + ' - Dotoday',
      currentUser: currentUser
    }
  });
});

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

app.get('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) return next(err);
    res.redirect('home');
  });
});


var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Listening on " + port);
});

function loadUser(req, res, next) {
  var user = req.session.userToken;
  console.log('loadUser');
  console.log(req.url);
  if (user) {
    req.currentUser = user;
    next();
  } else {
    if (req.url == '/')
      return next();
    res.redirect('home');
  }
}