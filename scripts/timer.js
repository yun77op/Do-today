define(function(require, exports, module) {
	var Settings = require('./settings.js');

	var el = $('#timer');
	var timeEl = $('.timer-time', el),
			progress = $('.timer-progress', el),
			buttonStart = $('.timer-start', el).click(run);
	
	var progressWidth,
			totalWidth = 432,
			initialWidth = progress.width();

	var count, step, instance, active;

	function initialize(type) {
		count = Settings.get('timer', type);
		count *= 60;
		progressWidth = initialWidth;
		step = (totalWidth - initialWidth) / count;
		updateTime(timeEl, count);
		progress.width(initialWidth);
	}

	var actionIndex = 2;
	var actionHandlers = {
		'start': {
			fn: function() {
				if ($(document).triggerHandler('timer:beforeStart')) {
					return;
				}
				var el = $(this);
				instance = interval(function(step) {
					progressWidth += step;
					progress.width(progressWidth);
					updateTime(timeEl, --count);
					if (count == 0) {
						actionIndex = 2;
						instance.stop();
						$(document).trigger('timer:complete');
					}
				}, step);
				active = true;
			},
			className: 'started'
		},

		'stop': {
			fn: function() {
				instance.stop();
				active = false;
			},
			className: 'stopped'
		},

		'reset': {
			fn: function() {},
			className: 'normal'
		}
	};
	var actions = _.keys(actionHandlers);

	function run() {
		var prevActionHandler = actionHandlers[actions[actionIndex]];
		actionIndex = (++actionIndex) % 3;
		var actionHandler = actionHandlers[actions[actionIndex]];
		if (actionHandler.fn.call(buttonStart[0])) {
			return;
		}
		buttonStart.removeClass(prevActionHandler.className).addClass(actionHandler.className);
		$(document).trigger('timer:action:' + actions[actionIndex]);
	}

	function interval(cb, step) {
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
	}

	function updateTime(el, count) {
		var m = Math.floor(count / 60),
				s = Math.floor(count % 60);
		
		function zeroFill(s) {
			s += '';
			return s.length == 1 ? '0' + s : s;
		}
		el.text(zeroFill(m) + ':' + zeroFill(s));
	}

	return {
		el: el,
		initialize: initialize,
		isActive: function() {
			return active;
		}
	};

});
