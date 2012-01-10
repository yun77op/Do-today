var models = require('../models');
var util = require('../lib/util');
var dateformat = require('../lib/dateformat').strftime;

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

  app.post('/task/note', access, function(req, res) {
    var body = req.body;
    var TaskModel = models(db, 'Task');
    TaskModel.findOne({ _id: body.taskId, user_id: req.user._id },
      function (err, doc) {
        doc.notes.push({
          content: body.content
        });
        var note = doc.toObject().notes.pop();
        note.created_at = dateformat(new Date(note.created_at), '%w/%m/%Y');
        doc.save(function() {
          res.send(note);
        });
      }
    );
  });
  
  app.put('/task/note', access, function(req, res) {
    var body = req.body;
    var TaskModel = models(db, 'Task');
    TaskModel.findOne({ _id: body.taskId, user_id: req.user._id },
      function (err, doc) {
        var data;
        doc.notes.forEach(function(el, index) {
          if (el._id == body.noteId) {
            el.content = body.content;
            data = el.toObject();
          }
        });
        doc.save(function() {
          res.send(data);
        });
      }
    );
  });

  app.delete('/task/note', access, function(req, res) {
    var body = req.body;
    var TaskModel = models(db, 'Task');
    TaskModel.findOne({ _id: body.taskId, user_id: req.user._id },
      function (err, doc) {
        doc.notes.forEach(function(el, index) {
          if (el._id == body.noteId) {
            el.remove();
          }
        });
        doc.save(function() {
          res.send('ok');
        });
      }
    );
  });

  app.put('/task/:id', access, function(req, res) {
    var body = req.body;
    var TaskModel = models(db, 'Task');
    TaskModel.findOne({ _id: req.params.id, user_id: req.user._id },
      function (err, doc) {
        util.extend(doc, body);
        doc.save(function() {
          res.send(doc.toObject());
        });
      }
    );
  });

  app.del('/task/:id', access, function(req, res) {
    var TaskModel = models(db, 'Task');
    TaskModel.findOne({ _id: req.params.id, user_id: req.user._id },
      function (err, doc) {
        doc.remove(function() {
          res.send('ok');
        });
      }
    );
  });


  app.get('/tasks/:dateText', access, function(req, res) {
    var TasksArchiveModel = models(db, 'TasksArchive');
    var dateText = req.params.dateText;
    TasksArchiveModel.findOne({ dateText: dateText, user_id: req.user._id },
      function (err, doc) {
        var data = doc ? doc.toObject().sessions : [];
        res.send(data);
      }
    );
  });

  app.post('/tasks/:dateText', access, function(req, res) {
    var TasksArchiveModel = models(db, 'TasksArchive');
    var doc = TasksArchiveModel(req.body);
    doc.dateText = req.params.dateText;
    doc.save(function () {
      res.send(doc.toObject().sessions);
    });
  });


  //Feed init data
  app.get('/init/:dateText', access, function(req, res) {
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
          var tasks = {};
          docs.forEach(function(doc) {
            var task = doc.toObject().task;
            task.notes.forEach(function(el, index) {
              el.created_at = dateformat(new Date(el.created_at), '%w/%m/%Y');
            });
            tasks[task._id] = task;
          });
          fn(tasks);
        });
    }

  });
};