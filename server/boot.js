var mongoStore = require('connect-mongodb');

// Return existing connection info
// http://dailyjs.com/2010/12/06/node-tutorial-5/
function mongoStoreConnectionArgs(db) {
  return {
      db: db.connections[0].db.databaseName
    , host: db.connections[0].db.serverConfig.host
    , port: db.connections[0].db.serverConfig.port
    , username: db.connections[0].user
    , password: db.connections[0].pass
  };
}

exports.bootApplication = function(app, db) {
  app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true }));
  });

  app.configure('production', function() {

  });

  app.configure(function () {
    // app.use(express.logger());
    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
      store: mongoStore(mongoStoreConnectionArgs(db)),
      secret: 'topsecret',
      maxAge : config.server.cookie_maxAge
    }));
    app.use(app.router);
    app.use(express.static(__dirname + '../public'));
  });

  app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true }));
  });
};

// ## Load Routes
exports.bootRoutes = function(app, db) {
  var walk    = require('walk')
    , path    = require('path')
    , files   = []
    , dir     = path.join(__dirname, 'routes')
    , walker  = walk.walk(dir, { followLinks: false });

  walker.on('file', function(root, stat, next) {
    files.push(root + '/' + stat.name);
    next();
  });

  walker.on('end', function() {
    files.forEach(function(file) {
      require(file)(app, db);
    });
    // Always keep this route last
    exports.bootExtras(app);
  });
};

// ## Extras
exports.bootExtras = function(app) {
  app.get('*', function(req, res, next) {
    var url = req.url
      , ua = req.headers['user-agent'];
    // ### Block access to hidden files and directories that begin with a period
    if (url.match(/(^|\/)\./)) {
      res.end("Not allowed");
    }
    // ### Better website experience for IE users
    //  Force the latest IE version, in cases when it may fall back to IE7 mode
    if(ua && ua.indexOf('MSIE') && /htm?l/.test(ua)) {
      res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
    }
    // ### CORS
    //  <http://github.com/rails/rails/commit/123eb25#commitcomment-118920>
    //  Use ChromeFrame if it's installed, for a better experience with IE folks
    //  Control cross domain using CORS http://enable-cors.org
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });
};

