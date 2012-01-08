define(function(require, exports, module) {
	var settings = require('./settings');

	return {
		settings: {
			fn: function(app) {
				settings.registerNamespace('timer', '计时器');
				settings.registerNamespace('notification', '提醒');

				settings.registerKey('timer', 'work', '工作间隔', 25, []);
				settings.registerKey('timer', 'break', '休息间隔', 5, []);

				settings.registerKey('notification', 'popup', '弹出提示', true, []);
				settings.registerKey('notification', 'sound', '声音提示', true, []);

				var settingsEl = $('#settings');
				var data = settings.data();
				var dialogSettings;

				settingsEl.delegate('a', 'click', function(e) {
					e.preventDefault();
					if (dialogSettings === undefined) {
						initSettingsDialog();
					}
					dialogSettings.dialog('open');
				});

				settings.subscribe('timer', 'work', function(value) {
					$(document).trigger('timer:settings:changed', ['work', value]);
				});

				function initSettingsDialog() {
					var text = new EJS({url: 'views/settings-dialog.ejs'}).render({settings: data});
					dialogSettings = $(text);
					dialogSettings.hide().appendTo('body').dialog({
						autoOpen: false,
						title: '设置'
					});
					bindEventSettingsDialog();
				}

				function bindEventSettingsDialog() {
					dialogSettings.delegate('input', 'change', function() {
						var el = $(this);
						var arr = el.attr('id').split('-');
						var ns = arr[1], key = arr[2], value;

						value = el.attr('type') == 'checkbox'? el.prop('checked') : el.val();
						settings.set(ns, key, value);
					});
				}
			}
		},

		overlay: {
			fn: function() {
				var OverlayTaskActions = Backbone.View.extend({
					el: $('#ui-overlay-task'),
					events: {
						'click .button-del': 'del',
						'click .button-hide': 'hide',
						'click .task-priority li': 'priority'
					},

					del: function(e) {
						e.preventDefault();
						this.host.taskActions.overlay('close');
						this.host.remove();
						$(document).trigger('task:rm', this.host.model.get('id'));
					},

					hide: function(e) {
						e.preventDefault();
						this.host.taskActions.overlay('close');
						this.host.remove();
						$(document).trigger('task:hide', [this.host.model.get('id'), this.host.model.attributes]);
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
							this.host.taskNotes.overlay('close');
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