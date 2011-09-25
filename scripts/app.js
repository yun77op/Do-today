define(function(require, exports, module) {

	Date.now = Date.now || function() {
		return new Date().getTime();  
	};

	var app = require('./base');
	var initMods = require('./init-mods');
	var message = require('./message');

	var Settings = require('./settings.js'),
			Storage = require('./storage.js'),
			Timer = require('./timer.js');

	app.use(initMods);

	//Connect timer with task with storage

	var mods = app.getMods();
	var Task = mods.task,
			Message = message.generate('main', {
				className: 'notice'
			});

		Message.show = _.wrap(Message.show, function(show) {
			if (Settings.get('notification', 'popup')) {
				var args = Array.prototype.slice.call(arguments, 1);
				show.apply(Message, args);
			}
		});

	var working = true,
			initial = false;

	$(document).bind('timer:beforeStart', function() {
		if (!initial && !Storage.set('current')) {
			if(confirm('你不添加个任务先？')) {
				$('input', Task.el)[0].focus();
				return true;
			}
			initial = true;
		}
	});

	$(document).bind('timer:action:reset', function(e) {
		Timer.initialize('work');
	});

	$(document).bind('timer:complete', function(e) {
		working = !working;
		Timer.initialize(working ? 'work' : 'break');
		if (!working) {
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
		if (handle === 'work' && working && !Timer.isActive()) {
			Timer.initialize('work');
		}
	});


	/**
	 *@namespace Task init functions
	 */
	Task.init = function() {
		var taskInit = Task.init;
		for (var i in taskInit) {
			if (taskInit.hasOwnProperty(i)) {
				taskInit[i]();
			}
		}
	};
	
	Task.init.current = function() {
 		var currentArr = Storage.set('current');
		if (currentArr && currentArr.length > 0) {
			_.each(currentArr, function(id) {
				var task = Storage.set(id);
				var taskModel = Task.addToCurrent(task);
				Task.currentObj[id] = taskModel;
			});
		}
	};
	
	Task.init.hidden = function() {
		var source = [],
			hiddenArr = Storage.set('hidden');
		if (hiddenArr) {
			_.each(hiddenArr, function(id) {
				var task = Storage.set(id);
				Task.hiddenObj[id] = task;
				source.push({
					id: id,
					value: task.content
				});
			});
		}
		Task.initAutocomplete(source);
	};

	Task.init.today = function() {
		var items = Storage.set(getDateHandle());
		items = _.map(items, function(item, id) {
			return {
				progress: item,
				task: Storage.set(id)
			};
		});
		Task.freshList(items, '#task-today-all');
	};

	/**
	 *@namespace Task attributes change handlers
	 */
	Task.fn = {};

	Task.fn.progress = function(id, val) {
		var path = [getDateHandle(), id];
		var data = Storage.set(path);
		if (!data) {
			data = [0];	
		};
		data[1] = val;
		Storage.set(path, data);
	};

	Task.fn.notes = function (id, val) {
		var path = [id, 'notes'];
		Storage.append(path, val);
	};

	/**
	 *@namespace
	 */
	Task.util = {};

	Task.util.removeTask = function(e, id) {
		removeStorageItem('current', id);
		Storage.remove(id);
		delete Task.currentObj[id];
	};

	Task.currentObj = {},
	Task.hiddenObj = {};

	$(document).bind('task:add', function(e, taskModel) {
		var task = _.clone(taskModel.attributes),
			id = task.id;
		Storage.set(id, task);
		Storage.append('current', id);
	});

	$(document).bind('task:add', function(e, taskModel) {
		Task.currentObj[taskModel.get('id')] = taskModel;
	});


	$(document).bind('task:del', Task.util.removeTask);
	$(document).bind('task:check', Task.util.removeTask);

	$(document).bind('task:beforeAdd', function(e, id) {
		if (Task.hiddenObj[id]) {
			removeStorageItem('hidden', id);
			var result = _.clone(Task.hiddenObj[id]);
			Storage.append('current', id);
			init_taskHidden();
			return result;
		}
	});

	$(document).bind('task:hide', function(e, id) {
		var taskModel = Task.currentObj[id],
			item = {
				id: id,
				value: taskModel.get('content')
			};
		Storage.append('hidden', id);
		removeStorageItem('current', id);
		init_taskHidden();
	});

	$(document).bind('task:change', function(e, id, key, val) {
		var taskModel = Task.currentObj[id],
			attr = {};
		attr[key] = val;
		
		if (typeof Task.fn[key] != 'undefined') {
			Task.fn[key].call(null, id, val);
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
		target == '#task-today-all' && Task.init.today();
	});

	$(document).bind('task:autocomplete:remove', function(e, id) {
		removeStorageItem('hidden', id);
		Storage.remove(id);
		delete Task.hiddenObj[id];

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
		Task.init();
		$('#mask').fadeOut();
	});
	
	
	function removeStorageItem(key, id) {
		Storage.filter(key, function(id_) {
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