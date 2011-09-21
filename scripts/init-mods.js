define(function(require, exports, module) {

	var Util = require('./util.js'),
		Settings = require('./settings.js'),
		ObjectID = require('./lib/objectid').ObjectID;

	$('.func-tipsy').tipsy();

	return {
		detect: {
			func: function() {

				//baidu iframe
				if (window != parent) {
					$('body').addClass('iframe');
					var params = Util.getPageParams();
					if (params['canvas_pos'] === 'search') {
						$('body').addClass('iframe-small');
					}
				}

			}
		},

		settings: {
			func: function(app, plugin) {
				Settings.registerNamespace('timer', '计时器');
				Settings.registerNamespace('notification', '提醒');

				Settings.registerKey('timer', 'work', '工作间隔', 25, []);
				Settings.registerKey('timer', 'break', '休息间隔', 5, []);

				Settings.registerKey('notification', 'popup', '弹出提示', true, []);
				Settings.registerKey('notification', 'sound', '声音提示', true, []);

				var el = $('#settings');
				
				var data = Settings.data();
				var dialogSettings = new EJS({url: 'views/settings-dialog.ejs'}).render({settings: data});
				dialogSettings = $(dialogSettings);
				dialogSettings.hide().appendTo('body').dialog({
					autoOpen: false
				});

				el.delegate('a', 'click', function(e) {
					e.preventDefault();
					dialogSettings.dialog('open');
				});

				el = $('#ui-dialog-settings');

				el.delegate('input', 'change', function() {
					var o = $(this);
					var arr = o.attr('id').split('-');
					var ns = arr[1], key = arr[2], value;

					value = o.attr('type') == 'checkbox'? o.prop('checked') : o.val();
					Settings.set(ns, key, value);
				});

				Settings.subscribe('timer', 'work', function(value) {
					$(document).trigger('timer:settings:changed', ['work', value]);
				});

			}
		},

		timer: {
			func: function(app, plugin) {
				var el = plugin.el = $('#timer');
			
				plugin.timeEl = $('.timer-time', el);

				var progress = $('.timer-start', el);

				var initialWidth = progress.width(),
					endWidth = 432;


				var time, step, width;

				function initialize(type) {
					time = Settings.get('timer', type);
					time *= 60;
					step = (endWidth - initialWidth) / time;
					width = initialWidth;
					plugin.updateTime.call(plugin, time);
					progress.width(width);
				}

				var startButton = $('#ui-button-timerStart', el).click(timing);

				var statusHandler = {
					'normal': function() {
						if ($(document).triggerHandler('timer:status:beforeStart'))
							return true;

						var o = $(this);                        

						plugin.instance = plugin.interval(function(step) {
							width += step;
							progress.width(width);
							plugin.updateTime.call(plugin, --time);
							if (time == 0) {
								o.removeClass(plugin.status);
								plugin.status = 'normal';
								statusHandler.started();
								$(document).trigger('timer:complete');
							}
						}, step);
						plugin.active = true;
					},

					'started': function() {
						plugin.instance && plugin.instance.stop();
						plugin.active = false;
					},

					'stopped': function() {
						plugin.active = false;
					}

				};

				var status = _.keys(statusHandler);

				function timing() {
					var prevStatus = plugin.status;
					if (statusHandler[prevStatus].call(startButton[0]))
						return;
					var index = (_.indexOf(status, prevStatus) + 1) % 3;
					plugin.status = status[index];
					startButton.removeClass(prevStatus).addClass(plugin.status);
					$(document).trigger('timer:status:' + plugin.status , plugin);
				}

				plugin.initialize = initialize;
				plugin.timing = timing;

			}, interval: function(cb, step) {
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
			status: 'normal',
			
			instance: null,

			active: false
		}, task: {
			func: function(app, plugin) {

				var el = plugin.el = $('#task');

				el.tabs({
					select: function(event, ui) {
						if (ui.index == 1) {
							var yesterday = new Date().valueOf() -  24 * 60 * 60 * 1000;
							$('#task-datepicker').val($.datepicker.formatDate('mm/dd/yy', new Date(yesterday)));
							$(document).trigger('task:date:change', yesterday);
						}
					}
				});
				
				var sortable = true;
				el.delegate('.actions .ui-button-reorder', 'click', function(e) {
					e.preventDefault();
					$(this).toggleClass('active');
					$(this).text((sortable ? '完成': '') + '重排');
					sortable = !sortable;
					var container = $('#task-today-current');
					$('.task-list', container).sortable({ disabled: sortable })
						.toggleClass('sortable');
				}).delegate('.actions .ui-button-viewall, .actions .ui-button-return', 'click', function(e) {
					e.preventDefault();
					var o = $(this);
					var target = $(o.attr('href'));
					$(document).trigger('task:containerToggle', o.attr('href'));
					target.siblings().fadeOut(function() {
						target.fadeIn();
					});
				});

				var TaskView = Backbone.View.extend({
					tagName: 'li',
					className: 'task',
					template: new EJS({url: 'views/task-current.ejs'}),
					initialize: function() {
						_.bindAll(this, 'render');
					},

					render: function() {
						var o = this;
						var data = this.model.attributes;
						this.template.update(this.el, data);
						
						this.taskActions = $('.task-actions-trigger', this.el).overlay({
							srcNode: '#ui-overlay-task',
							width: '10em',
							visible: false,
							show: function(e, ui) {
								$(document).trigger('overlay:task', o);
								$(this).overlay('option', {
									align: {
										node: e.target,
										points: ['RB', 'LT']
									}
								});
							}
						});

						this.taskNotes = $('.task-actions-notes', this.el).overlay({
							srcNode: '#ui-overlay-notes',
							width: '197px',
							visible: false,
							show: function(e, ui) {
								$(document).trigger('overlay:notes', o);
								$(this).overlay('option', {
									align: {
										node: e.target,
										points: ['RT', 'LB']
									}
								});
							}
						});

						$('.task-progress', this.el).slider({
							start: function(e, ui) {
								if (!$(document).triggerHandler('task:slide')) {
									e.preventDefault();
								}
							},

							slide: function(e, ui) {
								var currentVal = ui.value,
									val = $(this).slider('value');
								if (currentVal <= val) {
									e.preventDefault();
								}
							},

							stop: function(e, ui) {
								var valEl = $(this).siblings('.task-process-val');
								valEl.text(ui.value + '%');
								if (ui.value == 100) {
									o.check();
								}
								$(document).trigger('task:change', [o.model.get('id'), 'progress', ui.value]);  
							},

							value: o.model.get('progress')
						});

						$('.task-content', this.el).tipsy();

						return this;
					},

					events: {
						'click .task-content': 'edit',
						'click .task-check': 'check'
					},

					edit: function(e) {
						var o = this;
						var contentEl = $('.task-content', this.el);
						contentEl.hotedit('edit', function(text) {
							contentEl.text(text);
							$(document).trigger('task:change', [o.model.get('id'), 'content', text]);
						});
					},

					check: function(e) {
						var id = this.model.get('id');
						if(e.target != e.currentTarget) { return; }

						this.remove();
						$(document).trigger('task:change', [id, 'progress', 100]);
						$(document).trigger('task:check', id);
					}
				});

				_.extend(TaskView.prototype, {
					plug: function(plugin, opts) {
						plugin.host = this;
					}
				});

				el.delegate('input', 'keyup', function(e) {
					var o = $(this);
					if (e.which == 13) {
						var content = $.trim(o.val());
						o.val('');
						if (content === '')
							return;
						
						var hiddenId = o.data('hiddenId'),
							taskModel;
						if (hiddenId) {
							taskModel = $(document).triggerHandler('task:beforeAdd', hiddenId);
							o.removeData('hiddenId');

							plugin.addToCurrent(taskModel);
						} else {
							taskModel = plugin.addToCurrent({
								content: content
							});
							$(document).trigger('task:add', taskModel);
						}
					}
				});

				var TaskModel = Backbone.Model.extend({
					defaults: {
						priority: 0,
						progress: 0
					},

					initialize: function(attrs) {
						attrs['id'] || (this.attributes['id'] = 'o' + new ObjectID().toHexString());
						attrs['created_at'] || (this.attributes['created_at'] = new Date());
					}
				});

				var templateTaskSession = new EJS({element: 'template-task-session'}),
					templateTask = new EJS({element: 'template-task'});

				function addToCurrent(task) {
					var taskModel = task instanceof Backbone.Model ? task : new TaskModel(task);
					
					var taskView = new TaskView({
						model: taskModel
					});

					var container = $('#task-today-current', el),
						list = container.find('.task-list');
						
					container.removeClass('task-list-empty');
					list.append(taskView.render().el);
					
					$(document).trigger('task:current:add', taskModel);
					return taskModel;
				}

				function freshList(items, selector) {
					var container = $(selector),
							list = container.find('.task-list').empty();

					if (!data) {
						container.addClass('task-list-empty');
						list.append('<li>没有记录哦</li>');
					} else {
						_.each(items, function(item, id) {
							addToList(id, item, selector);
						});
					}
				}
				
				function addToList(id, item, selector) {
					var container = $(selector), el,
							list = container.find('.task-list');		
					container.removeClass('task-list-empty');
					el = templateTaskSession.render(item);
					list.append(el);
				}

				plugin.addToCurrent = addToCurrent;
				plugin.addToList = addToList;
				plugin.freshList = freshList;

				var input = $('#task-today-current input', el);

				plugin.initAutocomplete = function(source) {
					input.data('autocomplete') && input.autocomplete('destroy');
					input.autocomplete({
						source: source,
						minLength: 0,
						select: function( e, ui ) {
							$(this).data('hiddenId', ui.item.id);
						}
					});

					input.data( 'autocomplete' )._renderItem = function( ul, item ) {
						var a = $('<a>' + item.label + '</a>'),
							span = $('<span class="del" title="删除">x</span>');
							
						span.bind('click', function(e) {
							e.stopPropagation();
							$(this).parents('li').remove();
							$(document).trigger('task:autocomplete:remove', item.id);
						});
						a.append(span);
						return $( '<li></li>' )
							.data( 'item.autocomplete', item )
							.append( a )
							.appendTo( ul );
					};
				};

				$('.ui-trigger', el).click(function() {
					input.autocomplete('search', '');
				});

				$('#task-datepicker', el).datepicker({
					onClose: function(dateText, inst) {
						$(document).trigger('task:date:change', dateText);
					}
				});
			}
		},

		overlay: {
			func: function() {
				var OverlayView = Backbone.View.extend({
					el: $('#ui-overlay-task'),
					events: {
						'click .ui-button-del': 'del',
						'click .ui-button-hide': 'hide',
						'click .task-priority li': 'priority'
					},

					del: function(e) {
						e.preventDefault();
						this.host.taskActions.overlay('hide');
						this.host.remove();
						$(document).trigger('task:del', this.host.model.get('id'));
					},

					hide: function(e) {
						e.preventDefault();
						this.host.taskActions.overlay('hide');
						this.host.remove();
						$(document).trigger('task:hide', this.host.model.get('id'));
					},

					priority: function(e) {
						var el = $(e.target),
							priority = el.data('priority');
						$(document).trigger('task:change', [this.host.model.get('id'), 'priority', priority]);
						this.host.render();
					}
				});

				var overlayView = new OverlayView();

				$(document).bind('overlay:task', function(e, host) {
					overlayView.host = host;
				});

				/*
				var NotesView = Backbone.View.extend({
					el: $('#ui-overlay-notes'),
					events: {
						'click .ui-button-ok': 'ok',
						'click .ui-button-discard': 'discard'
					},

					ok: function(e) {
						var val = $.trim(this.el.find('textarea').val());
						if (val) {
							$(document).trigger('task:change', [this.host.model.get('id'), 'notes', val]);
							this.host.taskNotes.overlay('hide');
						}
					},

					discard: function(e) {
						this.host.taskNotes.overlay('hide');
					}
				});

				var notesView = new NotesView();
				$(document).bind('overlay:notes', function(e, host) {
					notesView.host = host;
				});

				*/
			}
		}
	}
});