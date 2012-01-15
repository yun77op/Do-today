var async = require('async');
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
    async.waterfall([
      function addTask(callback) {
        var TaskModel = models(db, 'Task');
        var doc = new TaskModel(req.body);
        doc.user_id = req.user._id;
        doc.save(function(err) {
          var data = doc.toObject();
          callback(err, data);
        });
      },
      function addCurrentTask(data, callback) {
        var TasksCurrentModel = models(db, 'TasksCurrent');
        var doc = new TasksCurrentModel({
          task: data._id,
          user_id: req.user._id
        });
        doc.save(function(err) {
          callback(err, data);
        });
      }
    ], function(err, data) {
      res.send(err ? err : data);
    });
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
      function(err, doc) {
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

  app.del('/task/note', access, function(req, res) {
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

  function updateTask(id, attrs, fn) {
    var TaskModel = models(db, 'Task');
    TaskModel.findById(id,
      function (err, doc) {
        if (err) { fn(err); }
        util.extend(doc, attrs);
        doc.save(function(err) {
          fn(err, doc.toObject());
        });
      }
    );
  }

  app.put('/task/:id', access, function(req, res) {
    updateTask(req.params.id, req.body, function(err, task) {
      res.send(err ? err : task);
    });
  });

  function removeTaskCurrent(taskId, fn) {
    models(db, 'TasksCurrent').findOne({ task: taskId },
      function(err, doc) {
        if (err) { return fn(err); }
        if (!doc) {
          err = new Error('Not found');
          return fn(err);
        }
        doc.remove(function(err) {
          fn(err);
        });
      }
    );
  }

  app.del('/task/:id', access, function(req, res) {
    var taskId = req.params.id;
    var userId = req.user._id;
    async.parallel({
      removeTask: function(callback) {
        models(db, 'Task').findOne({ _id: taskId, user_id: userId },
          function (err, doc) {
            if (err) {
              return callback(err);
            }
            doc.remove(function(err) {
              callback(err);
            });
          }
        );
      },
      removeTaskCurrent: function(callback) {
        removeTaskCurrent(taskId, function(err) {
          callback(err);
        });
      }
    }, function(err) {
      var result = err ? err : 'ok';
      res.send(result);
    });
  });


  app.get('/tasks/:dateText', access, function(req, res) {
    var TaskArchiveModel = models(db, 'TaskArchive');
    var dateText = req.params.dateText;
    TaskArchiveModel.findOne({ dateText: dateText, user_id: req.user._id },
      function(err, doc) {
        var data = doc ? doc.toObject().sessions : [];
        res.send(data);
      }
    );
  });

  app.post('/tasks/:dateText', access, function(req, res) {
    var TaskArchiveModel = models(db, 'TaskArchive');
    var doc = TaskArchiveModel(req.body);
    doc.dateText = req.params.dateText;
    doc.save(function () {
      res.send(doc.toObject().sessions);
    });
  });

  app.post('/completeTask/:id', access, function(req, res) {
    var taskId = req.params.id;
    var dateText = req.body.dateText;
    async.parallel([
      function updateTask(callback) {
        updateTask(taskId, {checked: true}, function(err, task) {
          callback(err, task);
        });
      },

      function addTaskArchive(callback) {
        var TaskArchiveModel = models(db, 'TaskArchive');
        var doc = new TaskArchiveModel({
          dateText: dateText,
          task: taskId
        });
        doc.save(function(err) {
          callback(err);
        });
      }
    ], function(err, results) {
      var task = results[0];
      res.send(err ? err : task);
    });

  });
  

  //Feed current tasks
  app.get('/currentTasks/:dateText', access, function(req, res) {
    var dateText = req.params.dateText;
    var ueserId = req.user._id;
    models(db, 'TasksCurrent')
      .find({user_id: ueserId})
      .populate('task')
      .run(function(err, docs) {
        if (err) { return res.send(err); }
        var tasks = {};
        docs.forEach(function(doc) {
          var task = doc.toObject().task;
          task.notes.forEach(function(el, index) {
            el.created_at = dateformat(new Date(el.created_at), '%w/%m/%Y');
          });
          tasks[task._id] = task;
        });
        res.send(tasks);
      });
  });

};