define(function(require, exports, module) {

    Date.now = Date.now || function() {
        return new Date().getTime();  
    };

    var app = require('./base');
    var initMods = require('./init-mods');
    var message = require('./message');

    var Settings = require('./settings.js'),
        Storage = require('./storage.js');

    app.use(initMods);


    //connect timer with task with storage

    var mods = app.getMods();

    
    var Timer = mods.timer,
        Task = mods.task,
        Message = message.generate('main', {
            className: 'notice'
        });

        Message.show = _.wrap(Message.show, function(show) {
            if (Settings.get('notification', 'popup')) {
                var args = Array.prototype.slice.call(arguments, 1);
                show.apply(Message, args);
            }
        });
    

    var sessionData = {},
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
        sessionData.startTime = Date.now();
    });


    $(document).bind('timer:status:stopped', function(e, task) {
        sessionData.endTime = Date.now();
    });

    
    $(document).bind('timer:status:normal', function(e, task) {
        Timer.initialize(working ? 'work' : 'break');
    });


    $(document).bind('timer:complete', function(e) {
        working = !working;
        Timer.initialize(working ? 'work' : 'break');
        if (!working) {
            Timer.timing();
            sessionData.endTime = Date.now();
            Message.option({
                buttons: {},
                text: '休息，休息一下！'
            });

            Message.show(true);
        } else {
            Message.option({
                buttons: {
                    'dismiss': {
                        'label': '清除',
                        'click': function() {
                            this.el.slideUp('slow');
                        }
                    }
                },

                text: '开始工作了！'
            });

            Message.show();
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


    $(document).bind('task:del', taskPerDel);


    $(document).bind('task:beforeAdd', function(e, id) {
        if (hiddenObj[id]) {
            delItem('hidden', id);
            var result = _.clone(hiddenObj[id]);
            delete hiddenObj[id];
            Storage.append('current', id);

            var t = _.select($('input', Task.el).data('autocomplete').options.source, function(item) {
                return item.id != id;
            });
            console.log(t);
            $('input', Task.el).data('autocomplete').options.source = t;

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
            session(id, taskModel.get(key), val);
        } else if (key == 'notes') {
            sessionNotes(val);
        }
        taskModel.set(attr);
        Storage.set(id, taskModel.attributes);
    });

    $(document).bind('task:check', taskPerDel);

    
    $(document).bind('task:date:change', function(e, dateText) {
        var date = getDateHandle(new Date(dateText)),
            obj = Storage.set(date);
        if (obj) {
             _.each(obj, function(tasks, sessionHandle) {
                var session = sessionHandle.split('-');
                _.each(tasks, function(task) {
                    Task.addToContainer(session, task, 'task-past-content');
                });
            });
        }
    });


    $(document).bind('task:containerToggle', function(e, target) {
        if (target == '#task-today-all') {
            freshTaskToday();
        }
    });


    $(document).bind('task:slide', function() {
        return !!(sessionData.startTime && sessionData.endTime && (!Timer.active || Timer.active && !working));
    });


    $(document).bind('init:domReady', function() {
        Timer.initialize('work');

        var arr = Storage.set('current');

        if (arr && arr.length > 0) {
            _.each(arr, function(id) {
                var taskModel = Storage.set(id);
                Task.addToCurrent(taskModel);
            });
        }
        
        freshTaskToday();

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

    function freshTaskToday() {
        var obj = Storage.set(getDateHandle());
        if (obj) {
            
            _.each(obj, function(tasks, sessionHandle) {
                var session = sessionHandle.split('-');
                _.each(tasks, function(task) {
                    Task.addToContainer(session, task, 'task-today-all');
                });
            });
        }
    }

    function getSession() {
        return sessionData.startTime + '-' + sessionData.endTime; 
    }


    var sessionTrack;

    function session(id, prevVal, currentVal) {
        var sessionHandle = getSession();
        if (!sessionHandle) return;
        var taskModel = currentObj[id];
        var dateHandle = getDateHandle(),
            data = {
                progress: [prevVal, currentVal],
                content: taskModel.get('content')
            };
        sessionTrack = true;
        Storage.append([dateHandle, sessionHandle], data);
    }

    function sessionNotes(val) {
        var sessionHandle = getSession();
        if (!sessionHandle || !sessionTrack) return;

        var dateHandle = getDateHandle();
        Storage.extend([dateHandle, sessionHandle], {
            notes: val
        });
    }

    function fresh() {
        sessionTrack = false;

    }


    function taskPerDel(e, id) {
        delItem('current', id);
        Storage.remove(id);
        delete currentObj[id];
    }
    
    function delItem(key, id) {
        Storage.mapReduce(key, function(id_) {
            return id_ != id; 
        });
    }
    

    function getDateHandle(date) {
        date || (date = new Date());
        return 'd' + [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('');
    }

    window.app = app;
    return app;

});