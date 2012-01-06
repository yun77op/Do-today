define(function(require, exports, module) {
  
  function getDateHandle(date) {
    if (date == undefined) {
      date = Date.now();
    }
    if (!(typeof date == 'object' && date instanceof Date)) {
      date = new Date(date);
    }
    return 'd' + [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('');
  }

  function Connect() {
    this.archiveData = {};
  }

  Connect.prototype = {
    start: function() {
      //TODO 零点情况，请求的还是当天的数据，返回数据时却是明天了
      var dateText = getDateHandle();
      var self = this;
      $.ajax('/init/' + dateText, {
        contentType: 'json',
        success: function(data) {
          self.currentTasks = data.current;
          self.archiveData[dateText] = data.today;
          self.renderUI();
        }
      });
    },
    renderUI: function() {
      var task, currentTasks = this.currentTasks;
      var hiddenTasks = [];
      for (var i = 0, l = currentTasks.length; i < l; ++i) {
        task = currentTasks[i];
        if (task.hidden) {
          hiddenTasks.push(task);
        } else {
          this.host.addToCurrent(task);
        }
      }
      var source = [];
      if (hiddenTasks.length > 0) {
        for (i = 0, l = hiddenTasks.length; i < l; ++i) {
          task = hiddenTasks[i];
          source.push({
            id: task._id,
            value: task.content
          });
        }
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
      $.ajax('/task/' + id, {
        type: 'delete',
        success: function () {
          delete self.currentTasks[id];
        }
      });
    },

    hideTask: function(id) {
      this.currentTasks[id].hidden = true;
    },

    getArchiveData: function(date, fn) {
      var dateText = getDateHandle(date);
      var data = this.archiveData[dateText];
      var self = this;
      if (!data) {
        $.ajax('/tasks/' + dateText, {
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

  var connect = new Connect();
  return {
    connect: connect
  };

});