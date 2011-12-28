var express = require('express');
var ejs = require('ejs');
var mongoStore = require('connect-mongodb');
var OAuth2 = require('./lib/oauth2').OAuth2;
var config = require('./lib/config').config;
var models = require('./lib/models');
var mongoose = require('mongoose');

var app = express.createServer();

app.configure('development', function() {
  app.set('db_uri', 'mongodb://localhost/dotoday_development');
  app.use(express.errorHandler({ dumpExceptions: true }));
});

app.configure('production', function() {
  app.set('db_uri', 'mongodb://localhost/dotoday_production');
});

app.configure(function () {
  // app.use(express.logger());
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    store: mongoStore({db: db}),
    secret: 'topsecret',
    maxAge : config.server.cookie_maxAge
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
  app.TasksCurrentModel = mongoose.model('TasksCurrent');
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
        title: '登陆 Dotoday'
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

app.get('/callback', function (req, res, next) {
  var parsedUrl = require('url').parse(req.url, true);
  var code = parsedUrl.query.code;
  var accessToken;
  oauth2.getAccessToken(code, function (err, data) {
    if (err) next(err);
    accessToken = data.access_token;
    getUid(function(uid) {
      checkExistUser(uid, function(user) {
        if (user) {
          doFinalAction(user.toObject());
        } else {
          getUserInfo(uid, function(userData) {
            saveUser(userData, function(userDataReturn) {
              doFinalAction(userDataReturn);
            });
          });
        }
      });
    });
  });
        
  function doFinalAction(userData) {
    req.session.userToken = userData;
    res.redirect('/app');
  }

  function saveUser(userData, fn) {
    var user = new app.UserModel();
    user._id = userData.id;
    user.name = userData.name;
    user.profile_image_url = userData.profile_image_url;
    user.access_token = accessToken;
    user.save(function () {
      fn(user.toObject());
    });
  }

  function checkExistUser(uid, fn) {
    app.UserModel.findById(uid, function(err, user) {
      if (err) next(err);
      fn(user);
     });
  }

  function getUid(fn) {
    oauth2.request({ path: '/2/account/get_uid.json' }, accessToken,
      function (err, data) {
        if (err) next(err);
        fn(data.uid);
      }
    );
  }

  function getUserInfo(uid, fn) {
    oauth2.request({ path: '/2/users/show.json' }, {uid: uid}, accessToken,
      function (err, data) {
        if (err) next(err);
        fn(data);
      }
    );
  }

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
    syncCurrentTasks(taskData._id, function() {
      res.send(taskData);
    });
  });

  function syncCurrentTasks(id, fn) {
    var tasksCurrent = new app.TasksCurrentModel({
      task_id: id
    });
    tasksCurrent.save(function() {
      fn();
    });
  }

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
  var ueserId = req.currentUser._id;
  app.TasksArchiveModel.findOne({ dateText: dateText, user_id: ueserId },
    function (err, tasksArchive) {
      result.todayData = tasksArchive ? tasksArchive.toObject().sessions : [];
      getCurrentTasks(req.currentUser.id, function(tasks) {
        result.currentTasks = tasks;
        res.send(result);
      });
    }
  );

  function getCurrentTasks(user_id, fn) {
    app.TasksCurrentModel.find({}, function(err, tasksCurrent) {
      var taskCount = tasksCurrent.length;
      var taskAry = [];
      tasksCurrent.forEach(function(taskId) {
        getTask(taskId, function(task) {
          taskAry.push(task.toObject());
          --taskCount || fn(taskAry);
        });
      });
    });
  }

  function getTask(taskId, fn) {
    app.TaskModel.findOne({ _id: taskId, user_id: ueserId },
      function (err, task) {
        fn(task);
      }
    );
  }

});

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