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
    }
  }
});