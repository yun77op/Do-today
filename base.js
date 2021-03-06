var express  = require('express');
var gzippo = require('gzippo');
var config = require('./config.json');
var FlashMessage = require('./lib/flash_message');
var mongoose = require('mongoose');
var flash = require('connect-flash');


// Login middleware
function loginHelper(req, res, next) {
  req.isLoggedIn = !!req.session.user;
  next();
}

function access(req, res, next) {
  if (req.isLoggedIn) {
    req.user = req.session.user;
    next();
  } else {
    if (req.route.path == '/')
      return next();
    res.redirect('home');
  }
}

// ## Boot DB
exports.bootDB = function(app) {
  var uri = process.env.MONGOLAB_URI ||
                  process.env.MONGOHQ_URL ||
                  'mongodb://localhost:27017/dotoday';

  return mongoose.connect(uri);
};

// ## Boot Application
exports.bootApplication = function(app, db) {
  var publicDir = __dirname + '/public';
  var maxAge = config.server.cookie_maxAge;
  app.configure(function () {
    app.engine('jade', require('jade').__express);
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.cookieSession({
      secret: 'topsecret',
      maxAge : maxAge
    }));
    app.use(flash());
    app.use(loginHelper);

    app.use(function(req, res, next) {
      app.locals({
        isLoggedIn: !!req.isLoggedIn,
        currentUser: req.session.user ? req.session.user : null
      });

      next();
    });

    app.locals({
      dateformat: require('./lib/dateformat').strftime
    });

    app.use(express.favicon(publicDir + '/favicon.ico'));
  });

  app.configure('development', function() {
    // Colorful logger
    // app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }));
    app.use(express.static(publicDir, {maxAge: 0}));
    app.set('showStackError', true);
  });

  app.configure('production', function() {
    // Enable gzip compression is for production mode only
    app.use(gzippo.staticGzip(publicDir, {maxAge: maxAge}));
    app.enable('view cache');
    app.set('showStackError', false);
  });

  app.use(app.router);

    // Generate token using Connect's csrf module
    //  and in your Jade view use the following:
    //  `input(type="hidden",name="_csrf", value=csrf)`
    // csrf: function(req, res) {
    //   return req.session._csrf;
    // }


  app.access = access;
};

// ## Load Routes
exports.bootRoutes = function(app, db) {
  var walk = require('walk');
  var path = require('path');
  var files = [];
  var dir = path.join(__dirname, 'routes');
  var walker  = walk.walk(dir, { followLinks: false });

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
    var url = req.url;
    var ua = req.headers['user-agent'];
    // ### Block access to hidden files and directories that begin with a period
    if (url.match(/(^|\/)\./)) {
      res.end("Not allowed");
    }
    // ### Better website experience for IE users
    //  <http://github.com/rails/rails/commit/123eb25#commitcomment-118920>
    //  Force the latest IE version, in cases when it may fall back to IE7 mode
    //  Use ChromeFrame if it's installed, for a better experience with IE folks
    if(ua && ua.indexOf('MSIE') && /htm?l/.test(ua)) {
      res.setHeader('X-UA-Compatible', 'IE=Edge,chrome=1');
    }
    // ### CORS
    //  Control cross domain using CORS http://enable-cors.org
    // res.setHeader('Access-Control-Allow-Origin', '*');
    // res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });
};

// ## Error Configuration
exports.bootErrorConfig = function(app) {
  // Since this is the last non-error-handling middleware use()d,
  //  we assume 404, as nothing else responded.
  app.use(function(req, res, next) {
    // The status option, or res.statusCode = 404 are equivalent,
    //  however with the option we get the "status" local available as well
    res.render('404', {
      layout: false,
      status: 404,
      title: 'Page not found :('
    });
  });

  app.use(function(err, req, res, next) {
    res.render('500', {
      layout: false,
      status: err.status || 500,
      error: err,
      showStack: app.settings.showStackError,
      title: 'Something went wrong, oops!'
    });
  });

  //     Error-handling middleware, take the same form as regular middleware,
  //     however they require an arity of 4, aka the signature (err, req, res, next)
  //     when connect has an error, it will invoke ONLY error-handling middleware.
  //
  //     If we were to next() here any remaining non-error-handling middleware would
  //     then be executed, or if we next(err) to continue passing the error, only
  //     error-handling middleware would remain being executed, however here we
  //     simply respond with an error page.
  // app.use(function(err, req, res, next) {
  //   // We may use properties of the error object here and next(err)
  //   // appropriately, or if we possibly recovered from the error, simply next().
  //   res.render('500', {
  //     layout: false,
  //     status: err.status || 500,
  //     error: err,
  //     showStack: app.settings.showStackError,
  //     title: 'Something went wrong, oops!'
  //   });
  // });
};