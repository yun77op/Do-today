define(function(require, exports, module) {

  Date.now = Date.now || function() {
    return new Date().getTime();  
  };

  function getDateHandle(date) {
    if (date == undefined) {
      date = Date.now();
    }
    if (!(typeof date == 'object' && date instanceof Date)) {
      date = new Date(date);
    }
    return 'd' + [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('');
  }

     
  var initPlugins = require('./init_plugins'),
         settings = require('./settings.js'),
          storage = require('./storage.js'),
         ObjectID = require('./lib/objectid').ObjectID;
      timerPlugin = require('./timer.js'),
          message = require('./message'),
              app = require('./base');

  app.use(initPlugins, true);

  //Connect timer with task with storage

  var taskPlugin = app.task;
  if (!timerPlugin.nativeNotity) {
    var messageMain = message.generate('main', {
      className: 'notice'
    });
  }

  var working = true,
      initial = false;

  $(document).bind('timer:beforeStart', function() {
    if (!initial && !storage.set('current')) {
      if(confirm('你不添加个任务先？')) {
        $('input', taskPlugin.el)[0].focus();
        return true;
      }
      initial = true;
    }
  });

  $(document).bind('timer:action:reset', function(e) {
    timerPlugin.initialize('work');
  });

  $(document).bind('timer:complete', function(e) {
    working = !working;
    timerPlugin.initialize(working ? 'work' : 'break');

    if (!settings.get('notification', 'popup')) { return; }

    var text = !working ? '休息，休息一下！' : '开始工作了！';
    if (timerPlugin.nativeNotity) {
      webkitNotifications.createNotification(
        '/webstore/logo-48.png',
        '时间到了',
        text
      ).show();
    } else {
      if (!working) {
        messageMain.option({
          actions: null,
          text: text
        });
        messageMain.show(true);
      } else {
        messageMain.option({
          actions: {
            'dismiss': {
              'label': '知道了',
              'click': function() {
                this.hide();
              }
            }
          },
          text: text
        });
        messageMain.show();
      }
    }

    if (!working) { timerPlugin.run(); }
  });

  $(document).bind('timer:settings:changed', function(e, key, value) {
    if (key === 'work' && working && !timerPlugin.isActive()) {
      timerPlugin.initialize('work');
    }
  });

  function Connect(task) {
    var self = this;
    this.task = task;
    $.ajax('/tasks', {
      contentType: 'json',
      success: function (data) {
        $.extend(self, data);
        this.initUi();
      }
    });
  }

  Connect.prototype = {
    initUi: function() {
      var self = this;
      var taskId, task;
      var source = [], hiddenTasksArr = [];
      for (taskId in this.store) {
        task = this.store[taskId];
        if (task.hidden) {
          hiddenTaskArr.push(task);
        } else {
          self.task.addToCurrent(task);
        }
      }

      if (hiddenTasksArr.length > 0) {
        _.each(hiddenTasksArr, function(task, taskId) {
          source.push({
            id: id,
            value: task.content
          });
        });
      }
      this.task.initAutocomplete(source);
    },

    sync: function () {
      $.ajax('/tasks', {
        type: 'post',
        data: this.store
      })
    },

    addTask: function(task) {
      var self = this;
      var id = task.id;
      $.ajax('/task', {
        type: 'post',
        data: task,
        success: function () {
          self.store[id] = task;
        }
      });
    },

    removeTask: function(id) {
      var self = this;
      $.ajax('/task', {
        type: 'delete',
        data: { id: id },
        success: function () {
          delete self.store[id];
        }
      });
    },

    hideTask: function(id) {
      this.store[id].hidden = true;
    },

    makeSessionList: function(selector, date) {
      var date = getDateHandle(date),
          items = this.archives[date];
      if (items == null) {
        items = [];
      }
      items = _.map(items, function(item, taskId) {
        item.task = this.storage[taskId];
        return item;
      });
      this.task.makeSessionList(selector, items);
    },

    taskAttrChange: function(taskId, key, val) {
      var task = this.store[taskId];
      task[key] = val;
    },

    progressChange: function (taskId) {
      
    },

    addNote: function (taskId, value) {
      var id = new ObjectID().toHexString();
      var note = {
        id: id,
        time: Date.now(),
        content: value
      };
      this.store[taskId].notes.id = note;
    },

    rmNote: function (taskId, id) {
      delete this.store[taskId].notes.id;
    },

    checkHidden: function (taskId) {
      var task = this.store[taskId];
      if (task.hidden) {
        task.hidden = false;
        return task;
      }
    }
  };

  $(document).bind('task:containerToggle', function(e, target) {
    if (target == '#task-today-all') {
      connect.makeSessionList('#task-today-all', Date.now());
    }
  });

  var connect = new Connect();

  $(function() {
    timerPlugin.initialize('work');
    $('.tipsy').tipsy();
    $('#mask').fadeOut();
  });

  window.app = app;
  return app;
});