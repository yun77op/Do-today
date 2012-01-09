define(function(require, exports, module) {
  
  function getDateHandle(date) {
    if (date === undefined) {
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
      var id;
      for (id in currentTasks) {
        task = currentTasks[id];
        if (task.hidden) {
          hiddenTasks.push(task);
        } else {
          this.host.addToCurrent(task);
        }
      }
      var source = [];
      if (hiddenTasks.length > 0) {
        for (var i = 0, l = hiddenTasks.length; i < l; ++i) {
          task = hiddenTasks[i];
          source.push({
            id: task._id,
            value: task.content
          });
        }
      }
      this.host.initAutocomplete(source);
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

    addTask: function(task, fn) {
      var self = this;
      $.ajax('/task', {
        type: 'post',
        data: task,
        success: function(task) {
          self.currentTasks[task._id] = task;
          fn(task);
        }
      });
    },

    removeTask: function(id) {
      var self = this;
      $.ajax('/task/' + id, {
        type: 'delete',
        success: function() {
          delete self.currentTasks[id];
        }
      });
    },

    hideTask: function(id) {
      this.currentTasks[id].hidden = true;
    },

    taskAttrChange: function(taskId, key, value, fn) {
      var task = this.currentTasks[taskId];
      var data = {};
      data[key] = value;
      $.ajax('/task/' + task._id, {
        type: 'put',
        data: data,
        success: function(data) {
          task[key] = value;
          fn();
        }
      });
    },

    addNote: function (taskId, note, fn) {
      var data = {
        content: note,
        taskId: taskId
      };
      var self = this;
      $.ajax('/task/note', {
        type: 'post',
        data: data,
        success: function(note) {
          self.currentTasks[taskId].notes.push(note);
          fn(note);
        }
      });
    },

    removeNote: function(taskId, noteId) {
      var self = this;
      var data = {
        taskId: taskId,
        noteId: noteId
      };
      $.ajax('/task/note', {
        type: 'delete',
        data: data,
        success: function() {
          self.currentTasks[taskId].notes = this.currentTasks[taskId].notes.filter(function(elm, index) {
            return elm._id != noteId;
          });
        }
      });
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