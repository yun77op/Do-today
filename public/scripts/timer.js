define(function(require, exports, module) {
  var settings = require('./settings'),
      connect = require('./connect');
      message = require('./message'),
      task = require('./task');

  var el = $('#timer');
  var timeEl = $('.timer-time', el),
      progressEl = $('.timer-progress', el),
      startButton = $('.timer-start', el).click(run);

  var count, step, instance, active;
      initial = true,
      working = true,
      notify;

  var progressWidth,
      totalWidth = 432,
      initialWidth = progressEl.width();

  function initialize(type) {
    count = settings.get('timer', type);
    count *= 60;
    progressWidth = initialWidth;
    step = (totalWidth - initialWidth) / count;
    updateTime(count);
  }

  var actionIndex = 0;
  var actionHandlers = {
    'start': {
      fn: function() {
        if (checkBeforeStart()) { return; }
        instance = interval(function() {
          progressWidth += step;
          progressEl.width(progressWidth);
          updateTime(--count);
          if (count == 0) {
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
    if (actionHandler.fn.call(startButton.get(0))) {
      return;
    }
    startButton.removeClass(prevActionHandler.className)
      .addClass(actionHandler.className);
    if (canTrigger != false) {
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
    }
  }
  
  if (window.webkitNotifications) {
    notify = function (text) {
      webkitNotifications.createNotification(
        '/webstore/logo-48.png',
        '时间到了',
        text
      ).show();
    };
  } else {
    var messageMain = message.generate('main', {
      className: 'notice'
    });

    notify = function (text) {
      if (!working) {
        messageMain.option({
          text: text
        });
        messageMain.show(true);
      } else {
        messageMain.option({
          actions: {
            'dismiss': {
              'label': '知道了',
              'click': function() {
                this.option({ actions: null });
                this.hide();
              }
            }
          },
          text: text
        });
        messageMain.show();
      }
    }
  }

  function updateTime(num) {
    var m = Math.floor(num / 60),
        s = Math.floor(num % 60);
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
