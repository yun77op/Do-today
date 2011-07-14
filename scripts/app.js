define(function(require, exports, module) {

    var app = require('./base');
    var initPlugins = require('./init_plugin');
    app.addInitPlugins(initPlugins);


    //connect timer with task with storage

    var plugins = app.initPlugins;

    var Storage = plugins.storage,
        Timer = plugins.timer,
        Message = plugins.message,
        Task = plugins.task;



    var session = {},
        working = true,
        initial = false;

    $(document).bind('timer:status:beforeStart', function() {
        if (!initial && !Storage.get('current')) {
            if(confirm('你不添加个任务先？')) {
                $('input', task.el)[0].focus();
                return true;
            }
            initial = true;
        }
    });

    $(document).bind('timer:status:started', function(e) {
        if (!working)
            return;
        session.startTime = Date.now();
        Task.mask.show();
    });


    $(document).bind('timer:status:stopped', function(e, task) {
        session.endTime = Date.now();
        Task.mask.hide();
    });

    
    $(document).bind('timer:status:normal', function(e, task) {
        Timer.initialize(working ? 'work' : 'relax');
    });

    
    $(document).bind('timer:complete', function(e) {
        working = !working;
        Task.mask.hide();
        Timer.initialize(working ? 'work' : 'relax');
        if (!working) {
            Message.show('休息，休息一下！', true);
            Timer.timing();
            session.endTime = Date.now();
        } else {
            Message.show('开始工作了！');
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
        $('input', task.el).data('autocomplete').options.source.push(item);
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
        var date = getDateHandle(new Date(dateText));
        var arr = Storage.get(date, true);
        if (arr) {
            _.each(arr, function(data) {
                Task.addToContainer(data, 'task-past-container');
            });
        }
    });



    $(document).bind('init:domReady', function() {
        Backbone.history = new Backbone.History();
        Backbone.history.start({pushState: true, root: '/Do-today'});
        Timer.initialize('work');
        var arr = Storage.get('current', true);
        if (arr) {
            _.each(arr, function(id) {
                var taskModel = Storage.get(id, true);
                Task.addToCurrent(taskModel);
            });
        }

        arr = Storage.get(getDateHandle(), true);
        if (arr) {
            _.each(arr, function(data) {
                Task.addToContainer(data, 'task-today-all');
            });
        }

        var source = [];
        arr = Storage.get('hidden', true);
        if (arr) {
            _.each(arr, function(id) {
                var taskModel = Storage.get(id, true);
                hiddenObj[id] = taskModel;
                source.push({
                    id: id,
                    value: taskModel.content
                });
            });
        }

        Task.initAutocomplete(source);

    });



    function taskSession(id, prevVal, currentVal) {
        var taskModel = currentObj[id];
        var date = getDateHandle(),
            data = {
                progress: [prevVal, currentVal],
                period: [session.startTime, session.endTime],
                content: taskModel.get('content')
            };
        Storage.append(date, data);
        Task.addToContainer(data, 'task-today-all');
    }

    
    function delItem(key, id) {
        Storage.mapReduce(key, function(item) {
            return item.id != id; 
        });
    }

    function perDelTask(id) {
        delItem('current', id);
        Storage.remove(id);
        delete currentObj[id];
    }

    function getDateHandle(date) {
        date || (date = new Date());
        return date.toUTCString().slice(0, -12).replace(/\s+/g, '');
    }


    window.app = app;
    return app;
});
