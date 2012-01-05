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
    var task = new TaskModel(req.body);
    task.user_id = req.user._id;
    task.save(function() {
      var taskData = task.toObject();
      syncCurrentTasks(taskData._id, function() {
        res.send(taskData);
      });
    });

    function syncCurrentTasks(taskId, fn) {
      var TasksCurrentModel = models(db, 'TasksCurrent');
      var doc = new TasksCurrentModel({
        task_id: taskId
      });
      doc.save(function() {
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
    TasksArchiveModel.findOne({ dateText: dateText, user_id: req.user._id },
      function (err, doc) {
        var data = doc ? doc.toObject().sessions : [];
        res.send(data);
      }
    );
  });

  app.post('/tasks/:dateText', access, function (req, res, next) {
    var TasksArchiveModel = models(db, 'TasksArchive');
    var doc = TasksArchiveModel(req.body);
    doc.dateText = req.params.dateText;
    doc.save(function () {
      res.send(doc.toObject().sessions);
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

