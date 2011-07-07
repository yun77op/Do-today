define(function(require, exports, module) {


    require('./lib/jquery-ui-1.8.14.custom.min.js');
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
                    progress.find('.button').removeClass('started');
                }

                plugin.initialize = initialize;

                el.delegate('.button', 'click', function(e) {

                    var o = $(this);

                    plugin.started = !plugin.started;
                    $(document).trigger('timer:' + (plugin.started ? 'start' : 'stop'), plugin);
                    if (plugin.started) {
                        o.addClass('started');
                        plugin.instance = plugin.interval(function(step) {
                            width += step;
                            progress.width(width);
                            plugin.updateTime.call(plugin, --time);
                            if (time == 0)
                                plugin.instance.complete(plugin);
                        }, step);
                    } else {
                        o.removeClass('started');
                        plugin.instance && plugin.instance.complete(plugin);
                    }
                    
                });

            }, interval: function(cb, step) {
                var t;
                function _interval() {
                    t = setTimeout(_interval, 1000);
                    cb(step);
                }

                t = setTimeout(_interval, 1000);
                return {
                    complete: function(plugin) {
                        plugin.started = false;
                        clearTimeout(t);
                        $(document).trigger('timer:complete');
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
            started: false,
            
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
                    $('.task-today-list', el).toggleClass('sortable');
                });             

                var TaskView = Backbone.View.extend({
                    tagName: 'li',
                    className: 'task',
                    template: _.template($('#task-template').html()),
                    initialize: function() {
                        _.bindAll(this, 'render', 'overlay');              
                    },

                    render: function() {
                        var data = this.model;
                        var content = this.template(data);
                        $(this.el).empty().append(content);
                        return this;
                    },

                    events: {
                        'click .task-actions-trigger': 'showActions'
                    },

                    showActions: function(e) {
                        e.preventDefault();
                        overlayView.host = this;
                        this.taskActions.overlay('toggle', e);
                    },

                    overlay: function() {
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
                        return this;
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
                    },

                    hide: function(e) {
                        this.del(e);
                    },

                    priority: function(e) {
                        var el = $(e.target),
                            priority = el.data('priority');
                        
                        $('.task-content', this.host.el).css('color', el.css('background-color'));

                    }
                });

                var overlayView = new OverlayView();


                el.delegate('input', 'keyup', function(e) {
                    var o = $(this);
                    if (e.which == 13) {
                        var name = $.trim(o.val());
                        o.val('');
                        if (name === '')
                            return;
                        var task = {
                            name: name
                        };

                        plugin.add(task);
                        $(document).trigger('task:add', task);
                    }
                });


                function add(task) {
                    var taskView = new TaskView({
                        model: {
                            name: task.name
                        }
                    });

                    task.id || (task.id = new ObjectID().toHexString());
                    task['created_at'] || (task['created_at'] = new Date());
                    task.priority || (task.priority = 0);

                    $('.task-today-list ul', el).append(taskView.render().overlay().el);
                }

                plugin.add = add;
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

                plugin.set = set;
                plugin.append = append;
                plugin.get = get;
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
        },

        connect: { //connect timer with task with storage
            
            func: function(app, plugin) {
                var plugins = app.initPlugins;

                var initial = false;
                var storage = plugins.storage,
                    timer = plugins.timer,
                    message = plugins.message,
                    task = plugins.task;

                function initialize() {
                    timer.initialize('work');
                    var currentArr = storage.get('current', true);
                    if (currentArr) {
                        _.each(currentArr, function(id) {
                            task.add(storage.get(id, true));
                        });
                    }
                }

                initialize();
                
                $(document).bind('timer:start', function(e) {
                    if (!initial && !storage.get('current')) {
                        if(confirm('你不添加个任务先？')) {
                            $('input', plugins.task.el)[0].focus();
                            plugin.started = false;
                        }
                        initial = true;
                    }
                });


                var working = true;
                $(document).bind('timer:complete', function(e, task) {
                    working = !working;
                    if (!working) {
                        message.show('休息，休息一下！');
                    } else {
                        message.show('开始工作了！'); 
                    }
                    plugins.timer.initialize(working ? 'work' : 'relax');
                });


                $(document).bind('task:add', function(e, task) {
                    var id = task.id;
                    delete task.id;
                    storage.set(id, task);
                    storage.append('current', id);
                    plugin.started = false;
                });

            }
        }
    }
});

