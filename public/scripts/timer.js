define(function(require, exports, module) {
  var settings = require('./settings');
  var connect = require('./connect');
  var message = require('./message');
  var task = require('./task');

  var el = $('#timer');
  var timeEl = $('.timer-time', el);
  var progressEl = $('.timer-progress', el);
  

  var active;
  var initial = true;
  var working = true;

  var progressWidth;

  var conf = {
    progressInitialWidth: 20,
    progressTotalWidth: 432
  };

  function initialize(type) {
    var num = settings.get('timer', type);
    num *= 60;
    progressWidth = conf.progressInitialWidth;
    step = (conf.progressTotalWidth - conf.progressInitialWidth) / num;
    updateTime(num);
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
            run(false);
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

  function run(canTrigger) {
    var prevActionHandler = actionHandlers[actions[(actionIndex + 2) % 3]];
    var actionHandler = actionHandlers[actions[actionIndex]];
    if (actionHandler.fn())) { return; }

    $('.timer-start', el).removeClass(prevActionHandler.className)
      .addClass(actionHandler.className);
    if (canTrigger !== false) {
      $(document).trigger('timer:action:' + actions[actionIndex]);
    }
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
    if (!working) { timer.run(); }
  }

  function checkBeforeStart() {
    if (initial && !connect.set('current')) {
      if(confirm('你不添加个任务先？')) {
        task.focusInput();
        return true;
      }
      initial = false;
    }
  }

  function interval(callback) {
    var timer = setInterval(callback, 1000);
    return {
      stop: function() {
        clearInterval(timer);
      }
    };
  }


  function updateTime(num) {
    var m = Math.floor(num / 60);
    var s = Math.floor(num % 60);
    timeEl.text(zeroFill(m) + ':' + zeroFill(s));
  }

  function zeroFill(s) {
    s += '';
    return s.length == 1 ? '0' + s : s;
  }

  return {
    initialize: initialize
  };

});
