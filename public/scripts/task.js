define(function(require, exports, module) {
  var connect = require('./app').connect;

  var el = $('#task');

  el.tabs({
    select: function(event, ui) {
      if (ui.index == 1) {
        var yesterday = new Date().valueOf() -  24 * 60 * 60 * 1000;
        $('#task-datepicker').val($.datepicker.formatDate('mm/dd/yy', new Date(yesterday)));
        connect.makeSessionList('#task-past', yesterday);
      }
    }
  });

  $('#task-datepicker', el).datepicker({
    onClose: function(dateText, inst) {
      connect.makeSessionList('#task-past', dateText);
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
    var o = $(this);
    var target = $(o.attr('href'));
    $(document).trigger('task:containerToggle', o.attr('href'));
    target.siblings().fadeOut(function() {
      target.fadeIn();
    });
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
      
      this.taskActions = $('.task-actions-trigger', this.el).overlay({
        srcNode: '#ui-overlay-task',
        open: function(e, ui) {
          $(document).trigger('overlay:task', self);
        }
      });

      this.taskNotes = $('.task-actions-notes', this.el).overlay({
        srcNode: '#ui-overlay-notes',
        position: {
          offset: '7 10',
          at: 'right bottom',
          my: 'right top'
        },
        open: function(e, ui) {
          $(document).trigger('overlay:notes', self);
        }
      });

      var slideStartValue;
      $('.task-progress', this.el).slider({
        start: function(e, ui) {
          slideStartValue = $(this).slider('value');
        },

        slide: function(e, ui) {
          if (ui.value <= slideStartValue) {
            e.preventDefault();
          } else {
            $(this).siblings('.task-process-val').text(ui.value + '%');
          }
        },

        stop: function(e, ui) {
          if (ui.value == 100) {
            self.check();
          }
          connect.progressChange(self.model.get('id'), slideStartValue, ui.value);
        },

        value: self.model.get('progress')
      });

      var taskContentEl = $('.task-content', this.el).hotedit({
        callback: function(text) {
          taskContentEl.text(text);
          $(document).trigger('task:change', [self.model.get('id'), 'content', text]);
        }
      });

      $('.task-content', this.el).tipsy();
      $('.task-actions-notes', this.el).tipsy();
      $('.task-actions-trigger', this.el).tipsy();
      return this;
    },

    events: {
      'click .task-check': 'check'
    },

    check: function(e) {
      var id = this.model.get('id');
      if(e.target != e.currentTarget) { return; }

      this.remove();
      $(document).trigger('task:change', [id, 'progress', 100]);
      $(document).trigger('task:check', id);
    }
  });

  el.delegate('input', 'keyup', function(e) {
    var el = $(this);
    if (e.which == 13) {
      var content = $.trim(el.val());
      el.val('');
      if (content === '') { return; }
      
      var hiddenId = el.data('hiddenId'), task;
      if (hiddenId) {
        task = $(document).triggerHandler('task:beforeAdd', hiddenId);
        $(document).trigger('task:autocomplete:remove', hiddenId);
        el.removeData('hiddenId');
        task.content = content;
        addToCurrent(task);
      } else {
        var taskModel = addToCurrent({
          content: content
        });
        task = taskModel.attributes;
      }
      $(document).trigger('task:add', task);
    }
  });

  var TaskModel = Backbone.Model.extend({
    defaults: {
      priority: 0,
      progress: 0
    },

    initialize: function(attrs) {
      attrs['id'] || (this.attributes['id'] = new ObjectID().toHexString());
      attrs['created_at'] || (this.attributes['created_at'] = Date.now());
    }
  });

  var templateTaskSession = new EJS({element: 'template-task-session'});

  function addToCurrent(task) {
    var taskModel = task instanceof Backbone.Model ? task : new TaskModel(task);
    var taskView = new TaskView({
      model: taskModel
    });

    var container = $('#task-today-current', el),
        list = container.find('.task-list');
      
    container.removeClass('task-list-empty');
    list.append(taskView.render().el);
    return taskModel;
  }

  function makeSessionList(items, selector) {
    var container = $(selector),
        list = container.find('.task-list').empty();
    if (!items || items.length == 0) {
      container.addClass('task-list-empty');
      list.append('<li class="task-default">没有记录哦</li>');
    } else {
      _.each(items, function(item, id) {
        addToList(id, item, selector);
      });
    }
  }
  
  function addToList(id, item, selector) {
    var container = $(selector),
        list = container.find('.task-list');
    container.removeClass('task-list-empty');
    var el = templateTaskSession.render(item);
    list.append(el);
  }

  function initAcSource(source) {
    input.data('autocomplete').options.source = source;
    input.data('autocomplete').source = function( request, response ) {
      response( $.ui.autocomplete.filter(source, request.term) );
    };
  }



  $(document).bind('task:rm task:hide', function() {
    var container = $('#task-today-current', el);
    if (container.find('li:visible').length == 0) {
      container.addClass('task-list-empty');
    }
  });

  var input = $('#task-today-current input', el);
  
  $(document).bind('task:hide', function(e, id, task) {
    var source = _.clone(input.data('autocomplete').options.source);
    if (!source) { source = []; }
    source.push({
      id: id,
      value: task.content
    });
    initAcSource(source);
  });

  $(document).bind('task:autocomplete:remove', function(e, id) {
    var source = _.select(input.data('autocomplete').options.source, function(item) {
      return item.id != id;
    });
    initAcSource(source);
  });
  
  function initAutocomplete = function(source) {
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

        connect.removeTask(item.id);
      });
      a.append(span);
      return $( '<li></li>' )
        .data( 'item.autocomplete', item )
        .append( a )
        .appendTo( ul );
    };
  };

  $('.ui-trigger', el).click(function() {
    input.autocomplete('search', '');
  });

  return {
    initAutocomplete: initAutocomplete,
    addToCurrent: addToCurrent,
    makeSessionList: makeSessionList
  };
  
});