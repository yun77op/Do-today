define(function(require, exports, module) {
  var connect = require('./connect').connect;

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
      console.log(this.el);
      this.template.update(this.el, data);
      // this.taskActions = $('.task-action-trigger', this.el).overlay({
      //   srcNode: '#ui-overlay-task',
      //   open: function(e, ui) {
      //     $(document).trigger('overlay:task', self);
      //   }
      // });

      // this.taskNotes = $('.task-action-notes', this.el).overlay({
      //   srcNode: '#ui-overlay-notes',
      //   position: {
      //     offset: '7 10',
      //     at: 'right bottom',
      //     my: 'right top'
      //   },
      //   open: function(e, ui) {
      //     $(document).trigger('overlay:notes', self);
      //   }
      // });

      // var slideStartValue;
      // $('.task-progress', this.el).slider({
      //   start: function(e, ui) {
      //     slideStartValue = $(this).slider('value');
      //   },

      //   slide: function(e, ui) {
      //     if (ui.value <= slideStartValue) {
      //       e.preventDefault();
      //     } else {
      //       $(this).siblings('.task-process-val').text(ui.value + '%');
      //     }
      //   },

      //   stop: function(e, ui) {
      //     if (ui.value == 100) {
      //       self.check();
      //     }
      //     connect.progressChange(self.model.get('_id'), slideStartValue, ui.value);
      //   },

      //   value: self.model.get('progress')
      // });

      // var taskContentEl = $('.task-content', this.el).hotedit({
      //   callback: function(text) {
      //     taskContentEl.text(text);
      //     $(document).trigger('task:change', [self.model.get('_id'), 'content', text]);
      //   }
      // });

      // $('.task-content, .task-action-trigger, .task-action-notes', this.el).tipsy();
      return this;
    },

    events: {
      'click .task-check': 'check'
    },

    check: function(e) {
      var id = this.model.get('_id');
      if(e.target != e.currentTarget) { return; }

      this.remove();
      connect.progressChange(id, this.model.get('progress'), 100);
    }
  });


  var templateTaskSession = new EJS({url: 'views/task-session.ejs'});

  function addToCurrent(taskData) {
    var task = new TaskView({
      model: new Backbone.Model(taskData)
    });
    
    var container = $('#task-today-current');
    var list = container.find('.task-list');
    var el = task.render().el;

    container.removeClass('task-list-empty');
    list.append(el);
  }

  function makeSessionList(id, date) {
    connect.getArchiveData(date, function (data) {
      var container = $('#' + id);
      var list = container.find('.task-list').empty();
      container.removeClass('task-list-empty');

      if (!data || data.length == 0) {
        container.addClass('task-list-empty');
        list.append('<li class="task-empty">没有记录哦!</li>');
      } else {
        _.each(data, function(item) {
          var el = templateTaskSession.render(item);
          list.append(el);
        });
      }
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
    if (container.find('li:visible').length == 0) {
      container.addClass('task-list-empty');
    }
  }

  $(document).bind('task:hide', function(e, id, task) {
    var source = _.clone(input.data('autocomplete').options.source);
    if (!source) { source = []; }
    source.push({
      id: id,
      value: task.content
    });
    initAcSource(source);
  });
  
  function initAutocomplete(source) {
    input.autocomplete({
      source: source,
      minLength: 0,
      select: function( e, ui ) {
        $(this).data('hiddenId', ui.item.id);
      }
    });

    input.data( 'autocomplete' )._renderItem = function( ul, item ) {
      var a = $('<a>' + item.label + '</a>'),
        span = $('<span class="del" title="删除">x</span>');
        
      span.bind('click', function(e) {
        e.stopPropagation();
        $(this).parents('li').remove();
        if ($(this).parents('ul').find('li').length == 0) {
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
    el.delegate('.actions .button-reorder', 'click', function(e) {
      e.preventDefault();
      $(this).toggleClass('active');
      $(this).text((sortable ? '完成': '') + '重排');
      sortable = !sortable;
      var container = $('#task-today-current');
      $('.task-list', container).sortable({ disabled: sortable })
        .toggleClass('sortable');
    }).delegate('.actions .button-viewall, .actions .button-return', 'click', function(e) {
      e.preventDefault();
      var targetID = this.href.slice(1);
      if (targetID == 'task-today-all') {
        makeSessionList(targetID, Date.now());
      }
      var target = $(this.href);
      target.siblings().fadeOut(function() {
        target.fadeIn();
      });
    });


    $('.button', el).click(function() {
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

    connect.start();
  }

  var expt = {
    initAutocomplete: initAutocomplete,
    addToCurrent: addToCurrent,

    focusInput: focusInput,
    start: start
  };

  connect.host = expt;

  return expt;

});