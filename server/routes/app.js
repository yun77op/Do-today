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
    var TaskModel = models(db, 'Task');
    var TasksCurrentModel = models(db, 'TasksCurrent');
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
    var TaskModel = models(db, 'Task');
    TaskModel.findOne({ _id: req.params.id, user_id: req.user._id },
      function (err, doc) {
        doc.remove(function() {
          res.send('ok');
        });
      }
    );
  });

  app.get('/tasks/:dateText', access, function (req, res, next) {
    var TasksArchiveModel = models(db, 'TasksArchive');
    var dateText = req.params.dateText;
    TasksArchiveModel.find({ dateText: dateText, user_id: req.user._id },
      function (err, data) {
        res.send(data.toObject().sessions);
      }
    );
  });

  app.post('/tasks/:dateText', access, function (req, res, next) {
    var TasksArchiveModel = models(db, 'TasksArchive');
    var tasksArchive = TasksArchiveModel(req.body);
    tasksArchive.dateText = req.params.dateText;
    tasksArchive.save(function () {
      res.send(data.toObject().sessions);
    });
  });


  //Feed init data
  app.get('/init/:dateText', access, function (req, res, next) {
    var TasksArchiveModel = models(db, 'TasksArchive');
    var result = {};
    var dateText = req.params.dateText;
    var ueserId = req.user._id;
    TasksArchiveModel.findOne({ dateText: dateText, user_id: ueserId },
      function (err, doc) {
        result.today = doc ? doc.toObject().sessions : [];
        getCurrentTasks(ueserId, function(tasks) {
          result.current = tasks;
          res.send(result);
        });
      }
    );

    function getCurrentTasks(ueserId, fn) {
      models(db, 'TasksCurrent')
        .find({user_id: ueserId})
        .populate('task_id')
        .run(function(err, docs) {
          var tasks = [];
          docs.forEach(function(doc) {
            taskAry.push(doc.toObject());
          });
          fn(tasks);
        });
    }

  });
}

