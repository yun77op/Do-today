var models = require('./models');

module.exports = function(app, db) {
  app.get('/app', loadUser, function (req, res) {
    var currentUser = req.currentUser;
    res.render('app', {
      locals: {
        title: currentUser.name + ' - Dotoday'
      }
    });
  });


  app.post('/task', loadUser, function (req, res, next) {
    var TaskModel = models('Task');
    var TasksCurrentModel = models('TasksCurrent');
    var task = new TaskModel(req.body);
    task.user_id = req.currentUser.id;
    task.save(function() {
      var taskData = task.toObject();
      syncCurrentTasks(taskData._id, function() {
        res.send(taskData);
      });
    });

    function syncCurrentTasks(id, fn) {
      var tasksCurrent = new TasksCurrentModel({
        task_id: id
      });
      tasksCurrent.save(function() {
        fn();
      });
    }

  });

  app.del('/task/:id', loadUser, function (req, res, next) {
    var TaskModel = models('Task');
    TaskModel.findOne({ _id: req.params.id, user_id: req.currentUser.id },
      function (err, task) {
        task.remove(function() {
          res.send('ok');
        });
      }
    );
  });

  app.get('/tasks/:dateText', loadUser, function (req, res, next) {
    var TasksArchiveModel = models('TasksArchive');
    var dateText = req.params.dateText;
    TasksArchiveModel.find({ dateText: dateText, user_id: req.currentUser.id },
      function (err, data) {
        res.send(data.toObject().sessions);
      }
    );
  });

  app.post('/tasks/:dateText', loadUser, function (req, res, next) {
    var TasksArchiveModel = models('TasksArchive');
    var tasksArchive = TasksArchiveModel(req.body);
    tasksArchive.dateText = req.params.dateText;
    tasksArchive.save(function () {
      res.send(data.toObject().sessions);
    });
  });


  //Feed init data
  app.get('/init/:dateText', loadUser, function (req, res, next) {
    var TasksArchiveModel = models('TasksArchive');
    var result = {};
    var dateText = req.params.dateText;
    var ueserId = req.currentUser._id;
    TasksArchiveModel.findOne({ dateText: dateText, user_id: ueserId },
      function (err, tasksArchive) {
        result.todayData = tasksArchive ? tasksArchive.toObject().sessions : [];
        getCurrentTasks(req.currentUser.id, function(tasks) {
          result.currentTasks = tasks;
          res.send(result);
        });
      }
    );

    function getCurrentTasks(user_id, fn) {
      TasksCurrentModel.find({}, function(err, tasksCurrent) {
        var taskCount = tasksCurrent.length;
        var taskAry = [];
        models('tasksCurrent').forEach(function(taskId) {
          getTask(taskId, function(task) {
            taskAry.push(task.toObject());
            --taskCount || fn(taskAry);
          });
        });
      });
    }

    function getTask(taskId, fn) {
      models('Task').findOne({ _id: taskId, user_id: ueserId },
        function (err, task) {
          fn(task);
        }
      );
    }

  });
}

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