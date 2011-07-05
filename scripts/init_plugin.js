define(function(require, exports, module) {


    require('./lib/jquery-ui-1.8.14.custom.min.js');

    var config = {
        timer: {
            workTime: 25 * 60,
            relaxTime: 5 * 60,
            initialWidth: 20,
            endWidth: 420
        }
    };

	return {
		timer: {
            func: function(app, plugin) {
                var el = plugin.el = $('#timer');
            
                plugin.timeEl = $('.timer-time', el);
                plugin.updateTime.call(plugin, config.timer.workTime);

                el.delegate('.button', 'click', function(e) {

                    var o = $(this),
                        process = o.parent();
                    var configTimer = config.timer;
                    
                    var unit = (configTimer.endWidth - configTimer.initialWidth) / configTimer.workTime;
                    var count = configTimer.initialWidth;

                    o.toggleClass('started');
                    plugin.started = !plugin.started;
                    var time = configTimer.workTime;
                    if (plugin.started) {
                        plugin.instance = plugin.interval(function() {
                            count += unit;
                            process.width(count);
                            plugin.updateTime.call(plugin, --time);
                            if (time == 0)
                                plugin.instance.stop();
                        });
                    } else {
                        plugin.instance.stop();
                    }
                    
                });

            }, interval: function(cb) {
                var t;
                function _interval() {
                    cb();
                    t = setTimeout(_interval, 1000);
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
                        _.bindAll(this, 'render');
                    },

                    render: function() {
                        var data = this.model.attributes;
                        var content = this.template(data);
                        $(this.el).empty().append(content);
                        return this;
                    },
                    events: {
                        'keyup input': 'addTask',
                        'click .task-actions-trigger': 'showActions',
                        'click .del-btn': 'del',
                        'click .hide-btn': 'hide'
                    },

                    addTask: function(e) {
                        
                    },

                    showActions: function(e) {
                        e.preventDefault();

                    },

                    del: function(e) {
                        e.preventDefault();
                        this.remove();
                    },

                    hide: function(e) {
                        e.preventDefault();
                        this.remove();
                    }
                };


                el.delegate('input', 'keyup', function(e) {
                    var o = $(this);
                    if (e.which == 13) {
                        var task = $.trim(o.val());
                        o.val('');
                        if (task === '')
                            return;
                        var taskView = new TaskView();
                        $('.task-today-list ul', el).append(taskView.el);
                    }
                });



            }
        }
	}
});

    