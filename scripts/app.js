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

	$(document).bind('timer:settings:changed', function(e, key, value) {
		if (key === 'work' && working && !Timer.isActive()) {
			Timer.initialize('work');
		}
	});

	function Store(storage) {
		this.storage = storage;
		this.stores = {};
	}

	Store.prototype.register = function(ns) {
		var self = this;
		this.stores[ns] = {};

		var actions = ['get', 'set', 'rm', 'persist'], ret = {};
		_.each(actions, function(action) {
			ret[action] = function () {
				var args = Array.prototype.slice.call(arguments);
				args.unshift(ns);
				return self[action].apply(self, args);
			};
		});
		return ret;
	};

	Store.prototype.get = function(ns, key) {
		var store = this.stores[ns];
		if (store != undefined) {
			return store[key];
		}
	};

	Store.prototype.set = function(ns, key, val) {
		var store = this.stores[ns];
		if (store != undefined) {
			store[key] = val;
		}
	};

	Store.prototype.rm = function(ns, key) {
		var store = this.stores[ns];
		if (store != undefined) {
			var ret = _.clone(store[key]);
			delete store[key];
			return ret;
		}
	};

	Store.prototype.persist = function(ns) {
		if (typeof this.stores[ns] != 'undefined') {
			this.storage.set(ns, _.keys(this.stores[ns]));
		}
	};

	/**
	 *@namespace Task init functions
	 */
	Task.init = function() {
		var taskInit = Task.init;
		Task.store = new Store(Storage);
		for (var i in taskInit) {
			if (taskInit.hasOwnProperty(i)) {
				taskInit[i]();
			}
		}
	};
	
	Task.init.current = function() {
		Task.storeCurrent = Task.store.register('current');
 		var currentArr = Storage.set('current');
		if (currentArr && currentArr.length > 0) {
			_.each(currentArr, function(id) {
				var task = Storage.set(id);
				Task.addToCurrent(task);
				Task.storeCurrent.set(id, task);
			});
		}
	};

	Task.init.hidden = function() {
		var source = [],
				hiddenArr = Storage.set('hidden');
		Task.storeHidden = Task.store.register('hidden');
		if (hiddenArr) {
			_.each(hiddenArr, function(id) {
				var task = Storage.set(id);
				Task.storeHidden.set(id, task);
				source.push({
					id: id,
					value: task.content
				});
			});
		}
		Task.initAutocomplete(source);
	};

	Task.init.today = function() {
		Task.util.makeSessionList('#task-today-all', Date.now());
	};


	/**
	 * @namespace Task attributes change handlers
	 */
	Task.fn = {};

	Task.fn.progress = function(id, key, val) {
		var dateHandle = getDateHandle();
		Storage.modify([dateHandle, id], function(data) {
			if (data == undefined) {
				data = [0];
			}
			data[1] = val;
			return data;
		});
	};

	Task.fn.notes = function (id, key, val) {
		var task = Task.storeCurrent.get(id),
				data = task[key];
		if (data == undefined) {
			data = [val];
		} else {
			data.push(val);
		}
		return data;
	};

	/**
	 * @namespace
	 */
	Task.util = {};

	Task.util.removeTask = function(e, id) {
		Task.storeCurrent.rm(id);
	};

	Task.util.makeSessionList = function(selector, date) {
		var date = getDateHandle(date),
				items = Storage.set(date);
		if (items == null) {
			items = [];
		}
		items = _.map(items, function(item, id) {
			return {
				progress: item,
				task: Storage.set(id)
			};
		});
		Task.makeSessionList(items, selector);
	};

	$(document).bind('task:add', function(e, task) {
		var id = task.id;
		Storage.set(id, task);
		Task.storeCurrent.set(id, task);
		Task.storeCurrent.persist();
	});

	$(document).bind('task:del', Task.util.removeTask);
	$(document).bind('task:check', Task.util.removeTask);

	$(document).bind('task:beforeAdd', function(e, id) {
		var task = Task.storeHidden.get(id);
		if (task) {
			Task.storeHidden.rm(id);
			Task.storeHidden.persist();
			return task;
		}
	});

	$(document).bind('task:hide', function(e, id) {
		var task = Task.storeCurrent.rm(id);
		Task.storeCurrent.persist();
		Task.storeHidden.set(id, task);
		Task.storeHidden.persist();
	});

	$(document).bind('task:change', function(e, id, key, val) {
		var task = Task.storeCurrent.get(id),
				result;
		if (typeof Task.fn[key] != 'undefined' &&
				(result = Task.fn[key].call(null, id, key, val)) != undefined) {
			val = result;
		}
		task[key] = val;
		Storage.set(id, task);
	});

	$(document).bind('task:date:change', function(e, dateText) {
		Task.util.makeSessionList('#task-past-content', dateText);
	});

	$(document).bind('task:containerToggle', function(e, target) {
		target == '#task-today-all' && Task.init.today();
	});

	$(document).bind('task:autocomplete:remove', function(e, id) {
		Task.storeHidden.rm(id);
		Task.storeHidden.persist();
		Storage.remove(id);
	});


	$(document).bind('init:domReady', function() {
		Timer.initialize('work');
		Task.init();
		$('#mask').fadeOut();
	});

	
	function getDateHandle(date) {
		if (date == undefined) {
			date = Date.now();
		}
		if (!(typeof date == 'object' && date instanceof Date)) {
			date = new Date(date);
		}
		return 'd' + [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('');
	}

	window.app = app;
	return app;
});