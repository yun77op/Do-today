define(function(require, exports, module) {

    var app = require('./base');
    var initPlugins = require('./init_plugin');
    app.addInitPlugins(initPlugins);


    //connect timer with task with storage

    var plugins = app.initPlugins;

    var initial = false;
    var storage = plugins.storage,
        timer = plugins.timer,
        message = plugins.message,
        task = plugins.task;
    
    $(document).bind('init:domReady', function() {
        Backbone.history = new Backbone.History();
        Backbone.history.start({pushState: true, root: '/Do-today'});
        timer.initialize('work');
        var arr = storage.get('current', true);
        if (arr) {
            _.each(arr, function(id) {
                var taskModel = storage.get(id, true);
                taskModel.id = id;
                task.addToCurrent(taskModel);
            });
        }
    });


    var session = {},
        working = true;
    $(document).bind('timer:status:started', function(e) {
        if (!initial && !storage.get('current')) {
            if(confirm('你不添加个任务先？')) {
                $('input', plugins.task.el)[0].focus();
                plugin.started = false;
                return;
            }
            initial = true;
        }
        session.startTime = Date.now();
    });


    $(document).bind('timer:status:stopped', function(e, task) {
        session.endTime = Date.now();
    });

    
    $(document).bind('timer:status:normal', function(e, task) {
        timer.initialize(working ? 'work' : 'relax');
    });

    
    $(document).bind('timer:complete', function(e, task) {
        working = !working;
        timer.initialize(working ? 'work' : 'relax');
        if (!working) {
            message.show('休息，休息一下！', true);
            timer.timing();
            session.endTime = Date.now();
        } else {
            message.show('开始工作了！');
        }
    });

    

    $(document).bind('task:add', function(e, taskModel) {
        var task = _.clone(taskModel.attributes);
        var id = task.id;
        delete task.id;
        storage.set(id, task);
        storage.append('current', id);
    });

    var currentObj = {};
    $(document).bind('task:current:add', function(e, taskModel) {
        currentObj[taskModel.get('id')] = taskModel;
    });

    $(document).bind('task:change', function(e, id, key, val) {
        var taskModel = currentObj[id],
            attr = {};
        attr[key] = val;
        taskModel.set(attr);
        storage.set(id, taskModel.attributes);
    });

    $(document).bind('task:del', function(e, id) {
        storage.remove(id);
    });

    $(document).bind('task:check', function(e, id) {
        var date = Date.now().toString();
        storage.append(date, id);

        var current = storage.get('current', true);
        current = _.without(current, id);
        storage.set('current', current);
    });

    window.app = app;
    return app;
});
