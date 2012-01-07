var models = require('../models');

module.exports = function(app, db) {
  var access = app.access;

  app.get('/app', access, function (req, res) {
    var user = req.user;
    res.render('app', {
      layout: false,
      locals: {
        title: user.name
      }
    });
  });

  app.post('/task', access, function (req, res) {
    var TaskModel = models(db, 'Task');
    var doc = new TaskModel(req.body);
    doc.user_id = req.user._id;
    doc.save(function() {
      var data = doc.toObject();
      addCurrentTask({
        task: data._id,
        user_id: req.user._id
      }, function() {
        res.send(data);
      });
    });

    function addCurrentTask(taskData, fn) {
      var TasksCurrentModel = models(db, 'TasksCurrent');
      var doc = new TasksCurrentModel(taskData);
      doc.save(function() {
        fn();
      });
    }

  });

  app.del('/task/:id', access, function (req, res) {
    var TaskModel = models(db, 'Task');
    TaskModel.findOne({ _id: req.params.id, user_id: req.user._id },
      function (err, doc) {
        doc.remove(function() {
          res.send('ok');
        });
      }
    );
  });

  app.get('/tasks/:dateText', access, function (req, res) {
    var TasksArchiveModel = models(db, 'TasksArchive');
    var dateText = req.params.dateText;
    TasksArchiveModel.findOne({ dateText: dateText, user_id: req.user._id },
      function (err, doc) {
        var data = doc ? doc.toObject().sessions : [];
        res.send(data);
      }
    );
  });

  app.post('/tasks/:dateText', access, function (req, res) {
    var TasksArchiveModel = models(db, 'TasksArchive');
    var doc = TasksArchiveModel(req.body);
    doc.dateText = req.params.dateText;
    doc.save(function () {
      res.send(doc.toObject().sessions);
    });
  });


  //Feed init data
  app.get('/init/:dateText', access, function (req, res) {
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
        .populate('task')
        .run(function(err, docs) {
          var tasks = [];
          docs.forEach(function(doc) {
            tasks.push(doc.toObject());
          });
          fn(tasks);
        });
    }

  });
}

