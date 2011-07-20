define(function(require, exports, module) {

    var app = require('./base');
    var initPlugins = require('./init_plugin');
    var message = require('./message');

    var Settings = require('./settings.js'),
        Storage = require('./storage.js');

    app.addInitPlugins(initPlugins);


    //connect timer with task with storage

    var plugins = app.initPlugins;

    

    var Timer = plugins.timer,
        Task = plugins.task,
        Message = message.generate('main');

        Message.show = _.wrap(Message.show, function(show) {
            if (Settings.get('notification', 'popup')) {
                var args = Array.prototype.slice.call(arguments, 1);
                show.apply(Message, args);
            }
        });


    var session = {},
        working = true,
        initial = false;

    $(document).bind('timer:status:beforeStart', function() {
        if (!initial && !Storage.set('current')) {
            if(confirm('你不添加个任务先？')) {
                $('input', Task.el)[0].focus();
                return true;
            }
            initial = true;
        }
    });

    $(document).bind('timer:status:started', function(e) {
        if (!working)
            return;
        session.startTime = Date.now();
    });


    $(document).bind('timer:status:stopped', function(e, task) {
        session.endTime = Date.now();
    });

    
    $(document).bind('timer:status:normal', function(e, task) {
        Timer.initialize(working ? 'work' : 'break');
    });


    $(document).bind('timer:complete', function(e) {
        working = !working;
        Timer.initialize(working ? 'work' : 'break');
        if (!working) {
            Timer.timing();
            session.endTime = Date.now();
            Message.options({
                buttons: {}
            });
            Message.show('休息，休息一下！', true);
        } else {
            Message.options({
                buttons: {
                    'dismiss': {
                        'label': '清除',
                        'click': function() {
                            this.el.slideUp('slow');
                        }
                    }
                }
            });
            Message.show('开始工作了！');
        }  
    });


    $(document).bind('timer:settings:changed', function(e, handle, value) {
        if (handle === 'work' && working && !Timer.active) {
            Timer.initialize('work');
        }
    });



    $(document).bind('task:add', function(e, taskModel) {
        var task = _.clone(taskModel.attributes),
            id = task.id;
        Storage.set(id, task);
        Storage.append('current', id);
    });

    var currentObj = {},
        hiddenObj = {};


    $(document).bind('task:current:add', function(e, taskModel) {
        currentObj[taskModel.get('id')] = taskModel;
    });


    $(document).bind('task:del', perDelTask);


    $(document).bind('task:beforeAdd', function(e, id) {
        if (hiddenObj[id]) {
            delItem('hidden', id);
            var result = _.clone(hiddenObj[id]);
            delete hiddenObj[id];
            Storage.append('current', id);
            return result;
        }
    });


    $(document).bind('task:hide', function(e, id) {
        var taskModel = currentObj[id],
            item = {
                id: id,
                value: taskModel.get('content')
            };
        Storage.append('hidden', id);
        delItem('current', id);
        hiddenObj[id] = taskModel.attributes;
        $('input', Task.el).data('autocomplete').options.source.push(item);
    });

    $(document).bind('task:change', function(e, id, key, val) {
        var taskModel = currentObj[id],
            attr = {};
        attr[key] = val;
        
        if (key == 'progress') {
            taskSession(id, taskModel.get(key), val);
        }
        taskModel.set(attr);
        Storage.set(id, taskModel.attributes);
    });

    $(document).bind('task:check', perDelTask);

    
    $(document).bind('task:date:change', function(e, dateText) {
        var date = getDateHandle(new Date(dateText)),
            obj = Storage.set(date),
            target = 'task-past-content';
        
        $('#' + target + ' .task-list').empty();
        
        if (obj) {
             _.each(obj, function(tasks, sessionHandle) {
                var session = sessionHandle.split('-');
                _.each(tasks, function(task) {
                    Task.addToContainer(session, task, target);
                });
            });
        }
    });

    $(document).bind('init:domReady', function() {
        //Backbone.history = new Backbone.History();
        //Backbone.history.start({pushState: true, root: '/Do-today'});

        Timer.initialize('work');
        

        var arr = Storage.set('current');

        if (arr && arr.length > 0) {
            _.each(arr, function(id) {
                var taskModel = Storage.set(id);
                Task.addToCurrent(taskModel);
            });
        }

        var obj = Storage.set(getDateHandle());
        if (obj) {
            _.each(obj, function(tasks, sessionHandle) {
                var session = sessionHandle.split('-');
                _.each(tasks, function(task) {
                    Task.addToContainer(session, task, 'task-today-all');
                });
            });
        }

        var source = [];
        arr = Storage.set('hidden');
        if (arr) {
            _.each(arr, function(id) {
                var taskModel = Storage.set(id);
                hiddenObj[id] = taskModel;
                source.push({
                    id: id,
                    value: taskModel.content
                });
            });
        }

        Task.initAutocomplete(source);
        $('#mask').fadeOut();
    });



    function taskSession(id, prevVal, currentVal) {
        if (!session.startTime || !session.endTime)
            return;
        var taskModel = currentObj[id];
        var dateHandle = getDateHandle(),
            data = {
                progress: [prevVal, currentVal],
                content: taskModel.get('content')
            };
        
        var sessionHandle = session.startTime + '-' + session.endTime;

        Storage.append([dateHandle, sessionHandle], data);

        Task.addToContainer(session, data, 'task-today-all');
    }

    
    function delItem(key, id) {
        Storage.mapReduce(key, function(id_) {
            return id_ != id; 
        });
    }

    function perDelTask(e, id) {
        delItem('current', id);
        Storage.remove(id);
        delete currentObj[id];
    }

    function getDateHandle(date) {
        date || (date = new Date());
        var dateText = date.toString();
        dateText = dateText.slice(0, dateText.lastIndexOf('('));

        return dateText.slice(0, -18).replace(/[\s|,]+/g, '');
    }

    window.app = app;
    return app;

});