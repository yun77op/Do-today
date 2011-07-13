define(function(require, exports, module) {


    require('./lib/jquery-ui-1.8.14.custom.min.js');
    require('./lib/jquery.tmpl.min.js');
    var ObjectID = require('./lib/objectid').ObjectID;

    var config = {
        timer: {
            workTime: 10,
            relaxTime: 10
        }
    };

    return {
        timer: {
            func: function(app, plugin) {
                var el = plugin.el = $('#timer');
            
                plugin.timeEl = $('.timer-time', el);

                var progress = $('.timer-start', el);

                var initialWidth = progress.width(),
                    endWidth = 432;


                var time, step, width;

                function initialize(type) {
                    //get config
                    time = config.timer[type + 'Time'];
                    step = (endWidth - initialWidth) / time;
                    width = initialWidth;
                    plugin.updateTime.call(plugin, time);
                    progress.width(width);
                }

                el.delegate('.button', 'click', timing);

                var statusHandler = {
                    'normal': function() {
                        if ($(document).triggerHandler('timer:status:beforeStart'))
                            return true;

                        var o = $(this);                        

                        plugin.instance = plugin.interval(function(step) {
                            width += step;
                            progress.width(width);
                            plugin.updateTime.call(plugin, --time);
                            if (time == 0) {
                                o.removeClass(plugin.status);
                                plugin.status = 'normal';
                                statusHandler.started();
                                $(document).trigger('timer:complete');
                            }
                        }, step);
                    },

                    'started': function() {
                        plugin.instance && plugin.instance.stop();
                    },

                    'stopped': function() {}

                };

                var status = _.keys(statusHandler);

                function timing() {
                    var button = el.find('.button');
                    var prevStatus = plugin.status;
                    if (statusHandler[prevStatus].call(button[0]))
                        return;
                    var index = (_.indexOf(status, prevStatus) + 1) % 3;
                    plugin.status = status[index];
                    button.removeClass(prevStatus).addClass(plugin.status);
                    $(document).trigger('timer:status:' + plugin.status , plugin);
                }

                plugin.initialize = initialize;
                plugin.timing = timing;

            }, interval: function(cb, step) {
                var t;
                function _interval() {
                    t = setTimeout(_interval, 1000);
                    cb(step);
                }

                t = setTimeout(_interval, 1000);
                return {
                    stop: function() {
                        clearTimeout(t);
                    }
                }
            },

            updateTime: function(time) {
                
                var m = Math.floor(time / 60),
                    s = Math.floor(time % 60);
                
                function zeroFill(s) {
                    s += '';
                    return s.length == 1 ? '0' + s : s;
                }
                this.timeEl.text(zeroFill(m) + ':' + zeroFill(s));

            },
            status: 'normal',
            
            instance: null
        }, task: {
            func: function(app, plugin) {
                var el = plugin.el = $('#task');

                _.templateSettings = {
                    interpolate : /\{\{(.+?)\}\}/g
                };


                el.tabs();

                var sortable = true;
                el.delegate('.actions #reorder-btn', 'click', function(e) {
                    e.preventDefault();
                    $(this).toggleClass('active');
                    $(this).text((sortable ? '完成': '') + '重排');
                    sortable = !sortable;
                    $( ".task-list ul" ).sortable({ disabled: sortable });
                    $('#task-today-current .task-list', el).toggleClass('sortable');
                }).delegate('.actions #viewall-btn, .actions #return-btn', 'click', function(e) {
                    e.preventDefault();
                    var o = $(this);
                    var target = $(o.attr('href'));
                    target.siblings().fadeOut(function() {
                         target.fadeIn();
                    });
                });



                var TaskView = Backbone.View.extend({
                    tagName: 'li',
                    className: 'task',
                    template: _.template($('#task-current-template').html()),
                    initialize: function() {
                        _.bindAll(this, 'render');
                    },

                    render: function() {
                        var o = this;
                        var data = this.model.attributes;
                        var content = this.template(data);
                        $(this.el).empty().append(content);
                        
                        this.taskActions = $('.task-actions-trigger', this.el).overlay({
                            srcNode: '#ui-overlay-task',
                            width: '10em',
                            visible: false,
                            show: function(e, ui) {
                                $(this).overlay('option', {
                                    align: {
                                        node: e.target,
                                        points: ['RB', 'LT']
                                    }
                                });
                            }
                        });

                        $('.task-progress', this.el).slider({
                            change: function(e, ui) {
                                var valEl = $(this).siblings('.task-process-val');
                                valEl.text(ui.value + '%');
                                if (ui.value == 100) {
                                    o.check();
                                }
                                $(document).trigger('task:change', [o.model.get('id'), 'progress', ui.value]);
                            },

                            value: o.model.get('progress')
                        });

                        return this;
                    },

                    events: {
                        'click .task-actions-trigger': 'showActions',
                        'click .task-content': 'edit',
                        'click .task-check': 'check'
                    },

                    showActions: function(e) {
                        e.preventDefault();
                        overlayView.host = this;
                        this.taskActions.overlay('toggle', e);
                    },

                    edit: function(e) {
                        var o = this;
                        var contentEl = $('.task-content', this.el);
                        contentEl.hotedit('edit', function(text) {
                            contentEl.text(text);
                            $(document).trigger('task:change', [o.model.get('id'), 'content', text]);
                        });
                    },

                    check: function(e) {
                        var id = this.model.get('id');
                        this.remove();
                        //$('#task-today-all ul', el).
                        $(document).trigger('task:check', id);
                        $(document).trigger('task:change', [id, 'progress', 100]);
                    }
                });

                _.extend(TaskView.prototype, {
                    plug: function(plugin, opts) {
                        plugin.host = this;
                    }
                });


               var OverlayView = Backbone.View.extend({
                    el: $('#ui-overlay-task'),
                    events: {
                        'click .del-btn': 'del',
                        'click .hide-btn': 'hide',
                        'click .task-priority li': 'priority'
                    },

                    del: function(e) {
                        e.preventDefault();
                        this.host.taskActions.overlay('hide');
                        this.host.remove();
                        $(document).trigger('task:del', this.host.model.get('id'));
                    },

                    hide: function(e) {
                        e.preventDefault();
                        this.host.taskActions.overlay('hide');
                        this.host.remove();
                        $(document).trigger('task:hide', this.host.model.get('id'));
                    },

                    priority: function(e) {
                        var el = $(e.target),
                            priority = el.data('priority');
                        $(document).trigger('task:change', [this.host.model.get('id'), 'priority', priority]);
                        this.host.render();
                    }
                });

                var overlayView = new OverlayView();


                el.delegate('input', 'keyup', function(e) {
                    var o = $(this);
                    if (e.which == 13) {
                        var content = $.trim(o.val());
                        o.val('');
                        if (content === '')
                            return;
                        
                        var task = {
                            content: content
                        };

                        var taskModel;
                        if (!(taskModel = $(document).triggerHandler('task:beforeAdd', taskModel))) {
                            taskModel = plugin.addToCurrent(task);
                        }
                        $(document).trigger('task:add', taskModel);
                    }
                });

                var TaskModel = Backbone.Model.extend({
                    defaults: {
                        priority: 0,
                        progress: 0
                    },

                    initialize: function(attrs) {
                        attrs['id'] || (this.attributes['id'] = new ObjectID().toHexString());
                        attrs['created_at'] || (this.attributes['created_at'] = new Date());
                    }
                });


                function addToCurrent(task) {
                    var taskModel = task instanceof Backbone.Model ? task : new TaskModel(task);
                    
                    var taskView = new TaskView({
                        model: taskModel
                    });

                    $('#task-today-current .task-list ul', el).append(taskView.render().el);
                    $(document).trigger('task:current:add', taskModel);
                    return taskModel;
                }

                $('#task-all-template').template('task-all');

                function addToContainer(task, container) {
                    var data = _.clone(task);
                    data.period = _.map(data.period, function(date) {
                        var d = new Date(date);
                        return d.toLocaleTimeString().slice(0, -3);
                    });

                    var result = $.tmpl('task-all', data, {
                        progress: function() {
                            if (this.data.progress[0] == 0 && this.data.progress[1] == 100) {
                                return false;
                            }
                            return true;
                        }
                    });
                    $('#'+ container + ' ul').empty().append(result);
                }

                plugin.addToToday = addToToday;
                plugin.addToContainer = addToContainer;


                $('#task-datepicker', el).datepicker({
                    onClose: function(dateText, inst) {
                        $(document).trigger('task:date:change', dateText);
                    }
                });
            }
        },

        storage: {
            func: function(app, plugin) {
                function set(key, val) {
                    if (typeof val == 'object')
                        val = JSON.stringify(val);
                    try {
                        localStorage[key] = val; 
                    } catch(e) {
                        
                    }
                }

                function get(key, isObject) {
                    var val = localStorage[key];
                    if (val && isObject)
                        val = JSON.parse(val);
                    return val;
                }

                function append(key, val_) {
                    var val = get(key, true);
                    if (val) {
                        val.push(val_);
                    } else {
                        val = [val_];
                    }
                    set(key, val);
                }

                function remove(key) {
                    localStorage.removeItem(key);
                }

                plugin.set = set;
                plugin.append = append;
                plugin.get = get;
                plugin.remove = remove;
            }
        },

        message: {
            func: function(app, plugin) {
                var el = plugin.el = $('#message');

                plugin.show = function(text) {
                    $('.message-text', el).text(text);
                    el.slideDown('slow');
                };

                $('.message-dismiss', el).click(function(e) {
                    el.slideUp('slow');
                })
            }  
        }
    }
});