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
					autoOpen: false,
					title: '设置'
				});

				el.delegate('a', 'click', function(e) {
					e.preventDefault();
					dialogSettings.dialog('open');
				});

				el = $('#ui-dialog-settings');

				el.delegate('input', 'change', function() {
					var el = $(this);
					var arr = el.attr('id').split('-');
					var ns = arr[1], key = arr[2], value;

					value = el.attr('type') == 'checkbox'? el.prop('checked') : el.val();
					Settings.set(ns, key, value);
				});

				Settings.subscribe('timer', 'work', function(value) {
					$(document).trigger('timer:settings:changed', ['work', value]);
				});
			}
		},

		task: {
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
				
				//sort
				var sortable = true;
				el.delegate('.actions .button-reorder', 'click', function(e) {
					e.preventDefault();
					$(this).toggleClass('active');
					$(this).text((sortable ? '完成': '') + '重排');
					sortable = !sortable;
					var container = $('#task-today-current');
					$('.task-list', container).sortable({ disabled: sortable })
						.toggleClass('sortable');
				}).delegate('.actions .button-viewall, .actions .button-return', 'click', function(e) {
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
						var self = this;
						var data = this.model.attributes;
						this.template.update(this.el, data);
						
						this.taskActions = $('.task-actions-trigger', this.el).overlay({
							srcNode: '#ui-overlay-task',
							visible: false,
							show: function(e, ui) {
								$(document).trigger('overlay:task', self);
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
							visible: false,
							show: function(e, ui) {
								$(document).trigger('overlay:notes', self);
								$(this).overlay('option', {
									align: {
										node: e.target,
										points: ['RT', 'LB']
									}
								});
							}
						});

						$('.task-progress', this.el).slider({
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
									self.check();
								}
								$(document).trigger('task:change', [self.model.get('id'), 'progress', ui.value]);  
							},

							value: self.model.get('progress')
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
							addToCurrent(taskModel);
						} else {
							taskModel = addToCurrent({
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

				var templateTaskSession = new EJS({element: 'template-task-session'});

				function addToCurrent(task) {
					var taskModel = task instanceof Backbone.Model ? task : new TaskModel(task);
					var taskView = new TaskView({
						model: taskModel
					});

					var container = $('#task-today-current', el),
							list = container.find('.task-list');
						
					container.removeClass('task-list-empty');
					list.append(taskView.render().el);
					return taskModel;
				}

				function freshList(items, selector) {
					var container = $(selector),
							list = container.find('.task-list').empty();

					if (!items) {
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
				var OverlayTaskActions = Backbone.View.extend({
					el: $('#ui-overlay-task'),
					events: {
						'click .button-del': 'del',
						'click .button-hide': 'hide',
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

				var overlayTaskActions = new OverlayTaskActions();

				$(document).bind('overlay:task', function(e, host) {
					overlayTaskActions.host = host;
				});

				
				var OverlayNotes = Backbone.View.extend({
					el: $('#ui-overlay-notes'),
					events: {
						'click .button-ok': 'ok',
						'click .button-discard': 'discard'
					},

					ok: function(e) {
						var val = $.trim(this.el.find('textarea').val());
						if (val) {
							$(document).trigger('task:change', [this.host.model.get('id'), 'notes', {
								content: val,
								time: Date.now()
							}]);
							this.host.taskNotes.overlay('hide');
						} else {
							alert('请输入内容');
						}
					},

					discard: function(e) {
						this.host.taskNotes.overlay('hide');
					}
				});

				var overlayNotes = new OverlayNotes();
				$(document).bind('overlay:notes', function(e, host) {
					overlayNotes.host = host;
				});

			}
		}
	}
});