define(function(require, exports, module) {
  var taskManager = require('./task');

  function Connect() {
    var self = this;
    $.ajax('/tasks', {
      contentType: 'json',
      success: function (data) {
        $.extend(self, data);
        var dateHandle = getDateHandle();
        self.todayData = self.archives[dateHandle];
        this.initUI();
      }
    });
  }

  Connect.prototype = {
    initUI: function() {
      var self = this;
      var taskId, task;
      var source = [], hiddenTasksArr = [];
      for (taskId in this.store) {
        task = this.store[taskId];
        if (task.hidden) {
          hiddenTaskArr.push(task);
        } else {
          taskManager.addToCurrent(task);
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
      taskManager.initAutocomplete(source);
    },

    sync: function () {
      $.ajax('/tasks', {
        type: 'post',
        data: this.store
      })
    },

    addTask: function(task, callback) {
      var self = this;
      $.ajax('/task', {
        type: 'post',
        data: task,
        success: function (task) {
          self.store[id] = task;
          callback(task);
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
      var dateText = getDateHandle(date),
          items = this.archives[date];
      if (items == null) {
        $.ajax('/archive/' + dateText, {
          contentType: 'json',
          success: function (data) {
            self.archives[date] = data;
            taskManager.makeSessionList(selector, data);
          }
        });
      } else {
        taskManager.makeSessionList(selector, items);
      }
    },

    taskAttrChange: function(taskId, key, val) {
      var task = this.store[taskId];
      task[key] = val;
    },

    progressChange: function (taskId, startValue, endValue) {
      var todayData = this.todayData;
      todayData[taskId] = {
        start: startValue,
        end: endValue
      };
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

    removeNote: function (taskId, id) {
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

  function getDateHandle(date) {
    if (date == undefined) {
      date = Date.now();
    }
    if (!(typeof date == 'object' && date instanceof Date)) {
      date = new Date(date);
    }
    return 'd' + [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('');
  }

  var connect = new Connect();

  return {
    connect: connect
  };

});