define(function(require, exports, module) {


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
                    return s.length == 1 ? '0' + s : s;
                }

                this.timeEl.text(zeroFill(m) + ':' + zeroFill(s));

                if (m + s == 0) {
                    return false;
                }
            },
            started: false,
            
            instance: null
        }, task: {
            func: function(app, plugin) {
                var el = plugin.el = $('#task');

                el.delegate('');
            }
        }
	}
});

    