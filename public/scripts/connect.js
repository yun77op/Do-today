define(function(require, exports, module) {

  function Connect(host) {
    var self = this;
    //TODO 零点情况，请求的还是当天的数据，返回数据时却是明天了
    var dateHandle = getDateHandle();
    $.ajax('/init/' + dateHandle, {
      contentType: 'json',
      success: function (data) {
        self.currentTasks = data.currentTasks;
        self.archiveData[dateHandle] = data.todayData;
        this.initUI();
      }
    });
    this.host = host;
  }

  Connect.prototype = {
    initUI: function() {
      var self = this;
      var taskId, task;
      var source = [], hiddenTasks = [];
      for (taskId in this.currentTasks) {
        task = this.currentTasks[taskId];
        if (task.hidden) {
          hiddenTasks.push(task);
        } else {
          this.host.addToCurrent(task);
        }
      }

      if (hiddenTasks.length > 0) {
        _.each(hiddenTasks, function(task, taskId) {
          source.push({
            id: id,
            value: task.content
          });
        });
      }
      this.host.initAutocomplete(source);
    },

    addTask: function(task, fn) {
      var self = this;
      $.ajax('/task', {
        type: 'post',
        data: task,
        success: function (task) {
          self.currentTasks[task._id] = task;
          fn(task);
        }
      });
    },

    removeTask: function(id) {
      var self = this;
      $.ajax('/task', {
        type: 'delete',
        data: { id: id },
        success: function () {
          delete self.currentTasks[id];
        }
      });
    },

    hideTask: function(id) {
      this.currentTasks[id].hidden = true;
    },

    getArchiveData: function(date, fn) {
      var dateText = getDateHandle(date),
      var data = this.archiveData[dateText];
      if (!data) {
        $.ajax('/archive/' + dateText, {
          contentType: 'json',
          success: function(data) {
            self.archiveData[dateText] = data;
            fn(data);
          }
        });
      } else {
        fn(data);
      }
    },

    taskAttrChange: function(taskId, key, val) {
      var task = this.currentTasks[taskId];
      task[key] = val;
    },

    progressChange: function(taskId, startValue, endValue) {
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
      this.currentTasks[taskId].notes.id = note;
    },

    removeNote: function (taskId, id) {
      delete this.currentTasks[taskId].notes.id;
    },

    checkHidden: function (taskId) {
      var task = this.currentTasks[taskId];
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

  return {
    Connect: Connect
  };

});