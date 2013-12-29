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
    this.archiveTasks = {};
  }

  Connect.prototype = {
    getCurrentTasks: function(fn) {
      //TODO 零点情况，请求的还是当天的数据，返回数据时却是明天了
      var dateText = getDateHandle();
      var self = this;
      $.ajax('/currentTasks/' + dateText, {
        success: function(data) {
          self.currentTasks = data;
          fn(data);
        }
      });
    },

    getArchiveTasks: function(date, fn) {
      var dateText = getDateHandle(date);
      $.ajax('/tasks/' + dateText, {
        success: function(data) {
          fn(data);
        }
      });
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

    removeTask: function(id, fn) {
      var self = this;
      $.ajax('/task/' + id, {
        type: 'delete',
        success: function() {
          delete self.currentTasks[id];
          fn();
        }
      });
    },

    updateTask: function(taskId, key, value, fn) {
      var self = this;
      var data = {};
      if (arguments.length == 3) {
        data = key;
        fn = value;
      } else {
        data[key] = value;
      }
      var task = this.currentTasks[taskId];
      $.ajax('/task/' + task._id, {
        type: 'put',
        data: JSON.stringify(data),
        contentType: 'application/json',
        processData: false,
        success: function(data) {
          self.currentTasks[taskId] = data;
          fn(data);
        }
      });
    },

    completeTask: function(taskId, fn) {
      var self = this;
      var data = {
        dateText: getDateHandle()
      };
      $.ajax('/completeTask/' + taskId, {
        type: 'post',
        data: data,
        success: function(data) {
          delete self.currentTasks[taskId];
          fn(data);
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

    removeNote: function(taskId, noteId, fn) {
      var self = this;
      var data = {
        taskId: taskId,
        noteId: noteId
      };
      $.ajax('/task/note', {
        type: 'delete',
        data: data,
        success: function() {
          self.currentTasks[taskId].notes = this.currentTasks[taskId].notes
            .filter(function(el, index) {
              return el._id != noteId;
            }
          );
          fn();
        }
      });
    },

    updateNote: function(taskId, noteId, content, fn) {
      var self = this;
      var data = {
        taskId: taskId,
        noteId: noteId,
        content: content
      };
      $.ajax('/task/note', {
        type: 'put',
        data: data,
        success: function(data) {
          self.currentTasks[taskId].notes.forEach(function(el, index) {
            if (el._id == noteId) {
              el.content = content;
            }
          });
          fn(data);
        }
      });
    }
  };

  var connect = new Connect();

  return {
    connect: connect
  };

});