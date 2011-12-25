var express = require('express'),
        ejs = require('ejs'),
 mongoStore = require('connect-mongodb'),
     OAuth2 = require('./lib/oauth2').OAuth2,
     config = require('./lib/config').config,
     models = require('./lib/models'),
   mongoose = require('mongoose');

var app = express.createServer();

app.configure('development', function() {
  app.set('db_uri', 'mongodb://localhost/dotoday-development');
  app.use(express.errorHandler({ dumpExceptions: true }));
});

app.configure('production', function() {
  app.set('db_uri', 'mongodb://localhost/dotoday-production');
});

app.configure(function () {
  app.use(express.logger());
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
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

models.defineModels(mongoose, function() {
  app.TaskModel = mongoose.model('Task');
  app.TasksArchiveModel = mongoose.model('TasksArchive');
  app.UserModel = mongoose.model('User');
  app.db = mongoose.connect(app.set('db_uri'));
});

var oauth2 = new OAuth2(config.oauth.client_id, config.oauth.client_secret,
      config.oauth.base_uri, config.server.base_uri + '/callback',
      '/oauth2/authorize', '/oauth2/access_token');

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
  res.redirect(oauth2.getAuthorizeURL());
});

app.get('/callback', function (req, res) {
  var parsedUrl = require('url').parse(req.url, true);
  var code = parsedUrl.query.code;
  oauth2.getAccessToken(code, function (data) {
    var access_token = data.access_token;
    oauth2.request({ path: '/account/get_uid.json' }, access_token,
      function (data) {
        oauth2.request({ path: '/users/show.json' }, {uid: data.uid}, access_token,
          function (data) {
            var user = new app.UserModel();
            user.name = data.name;
            user.profile_image_url = data.profile_image_url;
            user.access_token = access_token;
                    user.save(function () {
                        req.session.userToken = user.toObject();
              res.redirect('/app');
            });
          }
        );
      }
    );
  });
});

app.get('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) return next(err);
    res.redirect('home');
  });
});

app.post('/task', loadUser, function (req, res, next) {
  var task = new app.TaskModel(req.body);
  task.user_id = req.currentUser.id;
  task.save(function() {
    var taskData = task.toObject();
    syncCurrent(taskData._id, function() {
      res.send(taskData);
    });
  });
});

app.del('/task/:id', loadUser, function (req, res, next) {
  app.TaskModel.findOne({ _id: req.params.id, user_id: req.currentUser.id },
    function (err, task) {
      task.remove(function() {
        res.send('ok');
      });
    }
  );
});

app.get('/tasks/:dateText', loadUser, function (req, res, next) {
  var dateText = req.params.dateText;
  app.TasksArchiveModel.find({ dateText: dateText, user_id: req.currentUser.id },
    function (err, data) {
      res.send(data.toObject().sessions);
    }
  );
});

app.post('/tasks/:dateText', loadUser, function (req, res, next) {
  var tasksArchive = app.TasksArchiveModel(req.body);
  tasksArchive.dateText = req.params.dateText;
  tasksArchive.save(function () {
    res.send(data.toObject().sessions);
  });
});


//Feed init data
app.get('/init/:dateText', loadUser, function (req, res, next) {
  var result = {};
  var dateText = req.params.dateText;
  app.TasksArchiveModel.find({ dateText: dateText, user_id: req.currentUser.id },
    function (err, data) {
      result.todayData = data.toObject().sessions;
      getCurrent(req.currentUser.id, function(tasks) {
        result.currentTasks = tasks;
        res.send(result);
      });
    }
  );
});

function syncCurrent(id, fn) {
  app.TasksCurrent.findOne({}, function(err, d) {
    d.tasks.push(id);
    d.save(function() {
      fn();
    });
  });
}

function getCurrent(user_id, fn) {
  app.TasksCurrent.findOne({}, function(err, d) {
    var data = d.toObject();
    var tasks = [], taskNum = data.tasks.length;
    data.tasks.forEach(function(taskID) {
      app.TaskModel.findOne({ _id: taskID, user_id: user_id },
        function (err, task) {
          tasks.push(task.toObject());
          --taskNum || fn(tasks);
        }
      );
    });
  });
}

var port = process.env.PORT || 8888;
app.listen(port, function () {
  console.log("Listening on " + port);
});

function loadUser(req, res, next) {
  var user = req.session.userToken;
  if (user) {
    req.currentUser = user;
    next();
  } else {
    if (req.url == '/')
      return next();
    res.redirect('home');
  }
}