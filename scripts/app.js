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
        if (!working) return;
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
        hiddenObj;


    $(document).bind('task:current:add', function(e, taskModel) {
        currentObj[taskModel.get('id')] = taskModel;
    });


    $(document).bind('task:del', removeTask);
    $(document).bind('task:check', removeTask);

    $(document).bind('task:beforeAdd', function(e, id) {
        if (hiddenObj[id]) {
            removeStorageItem('hidden', id);
            var result = _.clone(hiddenObj[id]);
            Storage.append('current', id);
            initTaskHidden();
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
        removeStorageItem('current', id);
        initTaskHidden();
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

    
    $(document).bind('task:date:change', function(e, dateText) {
        var date = getDateHandle(new Date(dateText)),
            data = Storage.set(date);

        Task.freshList(data, '#task-past-content');
    });


    $(document).bind('task:containerToggle', function(e, target) {
        target == '#task-today-all' && initTaskToday();
    });


    $(document).bind('task:slide', function() {
        return !!(sessionData.startTime && sessionData.endTime && (!Timer.active || Timer.active && !working));
    });

    $(document).bind('task:autocomplete:remove', function(e, id) {
        removeStorageItem('hidden', id);
        Storage.remove(id);
        delete hiddenObj[id];

        var array = _.select($('.task-add input', Task.el).data('autocomplete').options.source, function(item) {
            return item.id != id;
        });
        $('.task-add input', Task.el).data('autocomplete').options.source = array;
        $('.task-add input', Task.el).data('autocomplete').source = function( request, response ) {
                response( $.ui.autocomplete.filter(array, request.term) );
        };
    });

    $(document).bind('init:domReady', function() {
        Timer.initialize('work');

        var currentArr = Storage.set('current');
        if (currentArr && currentArr.length > 0) {
            _.each(currentArr, function(id) {
                Task.addToCurrent(Storage.set(id));
            });
        }

        initTaskToday();
        initTaskHidden();

        $('#mask').fadeOut();
    });

    function initTaskHidden() {
        var source = [],
            hiddenArr = Storage.set('hidden');
        if (hiddenArr) {
            hiddenObj = {};
            _.each(hiddenArr, function(id) {
                var task = Storage.set(id);
                hiddenObj[id] = task;
                source.push({
                    id: id,
                    value: task.content
                });
            });
        }

        Task.initAutocomplete(source);
    }

    function initTaskToday() {
        var data = Storage.set(getDateHandle());
        Task.freshList(data, '#task-today-all');
    }

    function getSession() {
        return sessionData.startTime + '-' + sessionData.endTime; 
    }


    function session(id, prevVal, currentVal) {
        var sessionHandle = getSession();

        var taskModel = currentObj[id];
        var dateHandle = getDateHandle(),
            data = {
                progress: [prevVal, currentVal],
                content: taskModel.get('content')
            };
        Storage.append([dateHandle, sessionHandle], data);
    }


    function removeTask(e, id) {
        removeStorageItem('current', id);
        Storage.remove(id);
        delete currentObj[id];
    }
    
    function removeStorageItem(key, id) {
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