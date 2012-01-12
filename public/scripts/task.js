define(function(require, exports, module) {
  var connect = require('./connect').connect;

  var TaskNoteView = Backbone.View.extend({
    tagName: 'tr',
    template: new EJS({element: $('#template-note tr').get(0)}),
    render: function() {
      var data = this.model.attributes;
      this.template.update(this.el, data);
      this.el.id = 'note' + data._id;
      return this;
    },
    events: {
      'click .edit': 'edit',
      'click .del': 'del'
    },

    edit: function(e) {
      note.dialog.find('textarea').text(this.model.attributes.content);
      note.dialog.undelegate('.button-ok', 'click')
        .delegate('.button-ok', 'click', this.notesButtonCallback.bind(this));
    },

    del: function(e) {
      var data = this.model.attributes;
      this.remove();
      connect.removeNote(data.task._id, data._id);
    },

    notesButtonCallback: function() {
      var data = this.model.attributes;
      var textarea = note.dialog.find('textarea');
      var text = textarea.val().trim();
      connect.updateNote(data.task._id, data._id, text, function onSuccess(data) {
        $('#note' + data._id).find('.text').text(text);
        textarea.val('');
        note.dialog.delegate('.button-ok', 'click', note.buttonCallback);
      });
    }
  });

  var TaskView = Backbone.View.extend({
    tagName: 'li',
    className: 'task',
    template: new EJS({url: 'views/task-current.ejs'}),
    initialize: function() {
      _.bindAll(this, 'render');
    },

    render: function() {
      var self = this;
      var data = this.model.attributes;
      this.template.update(this.el, data);

      var elJ = $(this.el);
      $('.task-action-trigger', elJ).overlay({
        srcNode: '#ui-overlay-task',
        open: function(e, ui) {
          $(document).trigger('overlay:task', self);
        }
      });

      var taskContentEl = $('.task-content', elJ).hotedit({
        callback: function(text) {
          connect.taskAttrChange(self.model.get('_id'), 'content', text, function() {
            taskContentEl.text(text);
          });
        }
      });

      $('.task-content, .task-action-trigger, .task-action-notes', elJ).tipsy();
      return this;
    },

    removeTask: function() {
      var self = this;
      connect.removeTask(this.model.get('_id'), function() {
        self.remove();
      });
    },

    hideTask: function() {
      var self = this;
      connect.taskAttrChange(this.model.get('_id'), 'hidden', true, function() {
        var input = $('#task-today-current input');
        var source = _.clone(input.data('autocomplete').options.source);
        if (!source) { source = []; }
        source.push({
          id: id,
          value: task.content
        });
        initAcSource(source);
        self.remove();
      });
    },

    changePriority: function(priority) {
      var self = this;
      var prevPriority = this.model.get('priority');
      connect.taskAttrChange(this.model.get('_id'), 'priority', priority, function() {
        var prefix = 'task-priority-';
        $(self.el).removeClass(prefix + prevPriority)
          .addClass(prefix + priority);
      });
    },

    events: {
      'click .task-check': 'check',
      'click .task-action-notes': 'notes'
    },

    'notes': function(e) {
      e.preventDefault();

      //Connect {taskView} to {note}
      note.data = this.model.attributes;

      note.listNotes();
      note.dialog.dialog('open');
    },

    check: function(e) {
      var id = this.model.get('_id');
      if(e.target != e.currentTarget) { return; }

      this.remove();
      connect.progressChange(id, this.model.get('progress'), 100);
    }
  });

  var note = (function() {
    var dialog;

    function start() {
      dialog = $('#ui-dialog-notes').dialog({
        autoOpen: false,
        title: '任务备注'
      });
      dialog.delegate('.button-ok', 'click', buttonCallback);

      note.dialog = dialog;
    }

    function buttonCallback() {
      var textarea = dialog.find('textarea');
      var note = textarea.val().trim();
      textarea.val('');
      if (note === '') {
        textarea.focus();
      } else {
        addNote(note);
      }
    }

    function listNotes() {
      var notes = note.data.notes;
      var notesEl = dialog.find('.table-notes');
      var self = this;
      notesEl.hide();
      if (notes.length > 0) {
        notesEl.find('tbody').empty();
        notes.forEach(function(note, index) {
          addNote_(note);
        });
      }
    }

    function addNote(content) {
      var taskData = note.data;
      connect.addNote(taskData._id, content, function(note) {
        addNote_(note);
      });
    }

    function addNote_(data) {
      data.task = note.data;
      var taskNote = new TaskNoteView({
        model: new Backbone.Model(data)
      });
      taskNote.host = this;
      var notesEl = dialog.find('.table-notes');
      notesEl.find('tbody').append(taskNote.render().el);
      notesEl.show();
    }

    return {
      start: start,

      buttonCallback: buttonCallback,
      listNotes: listNotes,
      addNote: addNote
    };

  })();


  var templateTaskSession = new EJS({url: 'views/task-session.ejs'});

  function addToCurrent(taskData) {
    var task = new TaskView({
      model: new Backbone.Model(taskData)
    });

    var container = $('#task-today-current');
    var list = container.find('ul');
    container.removeClass('task-list-empty');
    list.append(task.render().el);
  }

  function makeSessionList(id, date, fn) {
    connect.getArchiveData(date, function (data) {
      var container = $('#' + id);
      var list = container.find('ul').empty();
      container.removeClass('task-list-empty');

      if (!data || data.length === 0) {
        container.addClass('task-list-empty');
        list.append('<li class="task-empty">没有记录哦!</li>');
      } else {
        _.each(data, function(item) {
          var el = templateTaskSession.render(item);
          list.append(el);
        });
      }
      fn && fn();
    });
  }

  var input = $('#task-today-current input');
  
  function focusInput() {
    input.get(0).focus();
  }

  function initAcSource(source) {
    input.data('autocomplete').options.source = source;
    input.data('autocomplete').source = function( request, response ) {
      response( $.ui.autocomplete.filter(source, request.term) );
    };
  }

  function acRemove(id) {
    var source = _.select(input.data('autocomplete').options.source, function(item) {
      return item.id != id;
    });
    initAcSource(source);
  }

  function checkTaskListStatus() {
    var container = $('#task-today-current');
    if (container.find('li:visible').length === 0) {
      container.addClass('task-list-empty');
    }
  }
  
  function initAutocomplete(source) {
    input.autocomplete({
      source: source,
      minLength: 0,
      select: function( e, ui ) {
        $(this).data('hiddenId', ui.item.id);
      }
    });

    input.data( 'autocomplete' )._renderItem = function( ul, item ) {
      var a = $('<a>' + item.label + '</a>');
      var span = $('<span class="del" title="删除">x</span>');
        
      span.bind('click', function(e) {
        e.stopPropagation();
        $(this).parents('li').remove();
        if ($(this).parents('ul').find('li').length === 0) {
          input.autocomplete('close');
        }

        connect.removeTask(item._id);
      });
      a.append(span);
      return $( '<li></li>' )
        .data( 'item.autocomplete', item )
        .append( a )
        .appendTo( ul );
    };
  }

  function start() {
    var el = $('#task');

    el.delegate('input', 'keyup', function(e) {
      var input = $(this);
      if (e.which == 13) {
        var content = $.trim(input.val());
        input.val('');
        if (content === '') { return; }
        
        var hiddenId = input.data('hiddenId'), task;
        if (hiddenId) {
          task = connect.checkHidden(hiddenId);
          acRemove(hiddenId);
          input.removeData('hiddenId');
          task.content = content;
          addToCurrent(task);
        } else {
          connect.addTask({
            content: content
          }, function (task) {
            addToCurrent(task);
          });
        }
      }
    });

    //sort
    var sortable = true;
    el.delegate('.actionArea .button-reorder', 'click', function(e) {
      $(this)
        .toggleClass('active')
        .text((sortable ? '完成': '') + '重排');
      sortable = !sortable;
      $('#task-today-current ul').sortable({ disabled: sortable })
        .toggleClass('sortable');
    });

    var isTodayListShow = false;
    el.delegate('.actionArea .listToday', 'click', function(e) {
      e.preventDefault();
      var text;
      var button = $(this);
      if (isTodayListShow) {
        text = '查看今日任务明细';
        $('#task-today-archive ul').empty();
      } else {
        var throbber = button.next();
        throbber.show();
        text = '隐藏';
        makeSessionList('task-today-archive', Date.now());
      }
      button.text(text);
      isTodayListShow = !isTodayListShow;
    });


    $('.task-add-button', el).click(function() {
      input.autocomplete('search', '');
    });


    el.tabs({
      select: function(event, ui) {
        if (ui.index == 1) {
          var yesterday = new Date().valueOf() -  24 * 60 * 60 * 1000;
          $('#task-datepicker').val($.datepicker.formatDate('mm/dd/yy', new Date(yesterday)));
          makeSessionList('task-archives', yesterday);
        }
      }
    });

    $('#task-datepicker', el).datepicker({
      onClose: function(dateText, inst) {
        makeSessionList('task-archives', dateText);
      }
    });
    

    var taskOverlay = $('#ui-overlay-task'), taskView;

    $('.del', taskOverlay).click(function() {
      taskView.removeTask();
    });

    $('.hide', taskOverlay).click(function() {
      taskView.hideTask();
    });

    $('.task-priority li', taskOverlay).click(function() {
      var priority = $(this).data('priority');
      taskView.changePriority(priority);
    });

    $(document).bind('overlay:task', function(e, v) {
      taskView = v;
    });

    note.start();
    connect.start();
  }

  var expt = {
    initAutocomplete: initAutocomplete,
    addToCurrent: addToCurrent,

    focusInput: focusInput,
    start: start,

    note: note
  };

  connect.host = expt;

  return expt;

});