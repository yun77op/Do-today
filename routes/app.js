var async = require('async');
var models = require('../models');
var util = require('../lib/util');
var dateformat = require('../lib/dateformat').strftime;

module.exports = function(app, db) {
  var access = app.access;

  app.get('/app', access, function (req, res) {
    var user = req.user;
    var options = {
      layout: false,
      title: user.name
    };
    if (req.flash('info').length > 0) {
      options.messages = {
        info: req.flash('info')
      };
    }
    res.render('app/app', options);
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

  function removeCurrentTask(taskId, fn) {
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
      removeCurrentTask: function(callback) {
        removeCurrentTask(taskId, function(err) {
          callback(err);
        });
      }
    }, function(err) {
      var result = err ? err : 'ok';
      res.send(result);
    });
  });
  
  app.post('/completeTask/:id', access, function(req, res) {
    var taskId = req.params.id;
    var dateText = req.body.dateText;
    async.parallel([
      function(callback) {
        updateTask(taskId, {checked: true}, function(err, task) {
          callback(err, task);
        });
      },
      function addTaskArchive(callback) {
        var TaskArchiveModel = models(db, 'TaskArchive');
        var doc = new TaskArchiveModel({
          user_id: req.user._id,
          date_text: dateText,
          task: taskId
        });
        doc.save(function(err) {
          callback(err);
        });
      },
      function(callback) {
        removeCurrentTask(taskId, function(err) {
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
    var TasksCurrentModel = models(db, 'TasksCurrent');
    var TaskModel = models(db, 'Task');
    var dateText = req.params.dateText;
    var userId = req.user._id;
    TasksCurrentModel
      .find({user_id: userId})
      .populate('task')
      .exec(function(err, docs) {
        if (err) { return res.send(err); }
        var tasks = {};
        docs.forEach(function(doc) {
          var task = doc.toObject().task;
          tasks[task._id] = task;
        });
        res.send(tasks);
      });
  });

  //Feed archive tasks
  app.get('/tasks/:dateText', access, function(req, res) {
    var TaskArchiveModel = models(db, 'TaskArchive');
    var dateText = req.params.dateText;
    var userId = req.user._id;
    TaskArchiveModel
      .find({ date_text: dateText, user_id: userId })
      .populate('task')
      .exec(function(err, docs) {
        if (err) { return res.send(err); }
        var results = docs.map(function(doc) {
          return doc.toObject();
        });
        res.send(results);
      });
  });
};