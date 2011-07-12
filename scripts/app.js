define(function(require, exports, module) {

    var app = require('./base');
    var initPlugins = require('./init_plugin');
    app.addInitPlugins(initPlugins);


    //connect timer with task with storage

    var plugins = app.initPlugins;

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

        arr = storage.get(getDateHandle(), true);
        if (arr) {
            _.each(arr, function(data) {
                task.addToContainer(data, 'task-today-all');
            });
        }
    });


    var session = {},
        working = true,
        initial = false;

    $(document).bind('timer:status:beforeStart', function() {
        if (!initial && !storage.get('current')) {
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



        //autocomplete
    var taskHidden = [{
        id: 34234234343,
        value: 'abc'
    }],
        taskHiddenID;



    $(document).bind('task:add', function(e, taskModel) {
        var task = _.clone(taskModel.attributes);
        var id = task.id;
        delete task.id;
        storage.set(id, task);
        storage.append('current', id);
        taskHiddenID = null;
    });

    var currentObj = {};
    $(document).bind('task:current:add', function(e, taskModel) {
        currentObj[taskModel.get('id')] = taskModel;
    });


    $(document).bind('task:del', perDelTask);


    $(document).bind('task:beforeAdd', function() {
        if (taskHiddenID) {
            taskHidden = _.filter(taskHidden, function(item) {
                return item.id !== taskHiddenID;
            });
            return currentObj[taskHiddenID];
        }
    });

    $('input', task.el).autocomplete({
        source: taskHidden,
        select: function( e, ui ) {
            taskHiddenID = ui.item.id;
            return false;
        }
    });


    $(document).bind('task:hide', function(e, id) {
        var taskModel = currentObj[id];
        taskHidden.push({
            id: id,
            value: taskModel.get('content')
        });
        //data
    });

    $(document).bind('task:change', function(e, id, key, val) {
        var taskModel = currentObj[id],
            attr = {};
        attr[key] = val;
        if (key == 'progress') {
            taskSession(id, taskModel.get(key), val);
        }
        taskModel.set(attr);
        storage.set(id, taskModel.attributes);
    });

    $(document).bind('task:check', perDelTask);


    


    function taskSession(id, prevVal, currentVal) {
        var taskModel = currentObj[id];
        var date = getDateHandle(),
            data = {
                progress: [prevVal, currentVal],
                period: [session.startTime, session.endTime],
                content: taskModel.get('content')
            };
        storage.append(date, data);
        task.addToContainer(data, 'task-today-all');
    }

    function delCurrentItem(id) {
        var current = storage.get('current', true);
        current = _.without(current, id);
        storage.set('current', current);
    }

    function perDelTask(id) {
        delCurrentItem(id);
        storage.remove(id);
        delete currentObj[id];
    }

    function getDateHandle(date) {
        date || (date = new Date());
        return date.toUTCString().slice(0, -12).replace(/\s+/g, '');
    }



    $(document).bind('task:date:change', function(e, dateText) {
        var date = getDateHandle(new Date(dateText));
        var arr = storage.get(date, true);
        if (arr) {
            _.each(arr, function(data) {
                task.addToContainer(data, 'task-past-container');
            });
        }

    });


    window.app = app;
    return app;
});
