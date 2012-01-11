define(function(require, exports, module) {
  var settings = require('./settings');
  var connect = require('./connect').connect;
  var message = require('./message');
  var task = require('./task');

  var el = $('#timer');
  var timeEl = $('.timer-time', el);

  var active;
  var initial = true;
  var working = true;
  var count;
  var progressWidth;

  var conf = {
    progressInitialWidth: 20,
    progressTotalWidth: 432
  };

  function initialize(type) {
    count = settings.get('timer', type);
    count *= 60;
    progressWidth = conf.progressInitialWidth;
    step = (conf.progressTotalWidth - conf.progressInitialWidth) / count;
    updateTime(count);
    $('.timer-start', el).click(run);

    var notify;

    if (window.webkitNotifications) {
      notify = function (text) {
        webkitNotifications.createNotification(
          '/webstore/logo-48.png',
          '时间到了',
          text
        ).show();
      };
    }

  }

  var actionIndex = 0;
  var step, instance;
  var progressEl = $('.timer-progress', el);
  var actionHandlers = {
    'start': {
      fn: function() {
        if (checkBeforeStart()) { return; }
        instance = interval(function() {
          progressWidth += step;
          progressEl.width(progressWidth);
          updateTime(--count);
          if (count === 0) {
            run();
            run();
            complete();
          }
        });
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
    var prevActionHandler = actionHandlers[actions[(actionIndex + 2) % 3]];
    var actionHandler = actionHandlers[actions[actionIndex]];
    if (actionHandler.fn()) { return; }

    $('.timer-start', el).removeClass(prevActionHandler.className)
      .addClass(actionHandler.className);
    actionIndex = (++actionIndex) % 3;
  }

  $(document).bind('timer:action:reset', function(e) {
    initialize('work');
  });


  function change() {
    if (key === 'work' && working && !active) {
      initialize('work');
    }
  }

  function complete() {
    working = !working;
    timer.initialize(working ? 'work' : 'break');
    if (!settings.get('notification', 'popup')) { return; }
    var text = !working ? '休息，休息一下！' : '开始工作了！';
    nofity();
    if (!working) { run(); }
  }

  function checkBeforeStart() {
    if (initial && connect.currentTasks.length === 0) {
      if(confirm('你不添加个任务先？')) {
        task.focusInput();
        return true;
      }
    }
    initial = false;
  }

  function interval(callback) {
    var timer = setInterval(callback, 1000);
    return {
      stop: function() {
        clearInterval(timer);
      }
    };
  }

  function updateTime(count) {
    var m = Math.floor(count / 60);
    var s = Math.floor(count % 60);
    timeEl.text(xPad(m) + ':' + xPad(s));
  }

  function xPad(s) {
    s += '';
    return s.length == 1 ? '0' + s : s;
  }

  return {
    initialize: initialize
  };

});
