var models = require('../models');

module.exports = function(app, db) {
  var access = app.access;

  app.get('/app', access, function (req, res) {
    var user = req.user;
    res.render('app', {
      locals: {
        title: user.name
      }
    });
  });


  app.post('/task', access, function (req, res, next) {
    var TaskModel = models('Task');
    var TasksCurrentModel = models('TasksCurrent');
    var task = new TaskModel(req.body);
    task.user_id = req.user._id;
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

  app.del('/task/:id', access, function (req, res, next) {
    var TaskModel = models('Task');
    TaskModel.findOne({ _id: req.params.id, user_id: req.user._id },
      function (err, task) {
        task.remove(function() {
          res.send('ok');
        });
      }
    );
  });

  app.get('/tasks/:dateText', access, function (req, res, next) {
    var TasksArchiveModel = models('TasksArchive');
    var dateText = req.params.dateText;
    TasksArchiveModel.find({ dateText: dateText, user_id: req.user._id },
      function (err, data) {
        res.send(data.toObject().sessions);
      }
    );
  });

  app.post('/tasks/:dateText', access, function (req, res, next) {
    var TasksArchiveModel = models('TasksArchive');
    var tasksArchive = TasksArchiveModel(req.body);
    tasksArchive.dateText = req.params.dateText;
    tasksArchive.save(function () {
      res.send(data.toObject().sessions);
    });
  });


  //Feed init data
  app.get('/init/:dateText', access, function (req, res, next) {
    var TasksArchiveModel = models('TasksArchive');
    var result = {};
    var dateText = req.params.dateText;
    var ueserId = req.user._id;
    TasksArchiveModel.findOne({ dateText: dateText, user_id: ueserId },
      function (err, tasksArchive) {
        result.todayData = tasksArchive ? tasksArchive.toObject().sessions : [];
        getCurrentTasks(req.user._id, function(tasks) {
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

