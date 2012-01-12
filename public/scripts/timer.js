define(function(require, exports, module) {
  var settings = require('./settings');
  var connect = require('./connect').connect;
  var message = require('./message');
  var taskMod = require('./task');

  var el;
  var timeEl;

  var active;
  var initial = true;
  var working = true;
  var count;
  var progressWidth;
  var notify; //webkit notifications

  var conf = {
    progressInitialWidth: 20,
    progressTotalWidth: 432
  };

  function initialize() {
    el = $('#timer');
    timeEl = $('.timer-time', el);
    $('.timer-start', el).click(run);
    if (window.webkitNotifications) {
      notify = function(title, body) {
        webkitNotifications.createNotification(
          '/assets/logos/logo-48.png',
          title,
          body
        ).show();
      };
    }
  }

  function initSession(type) {
    count = settings.get('timer', type);
    count *= 60;
    progressWidth = conf.progressInitialWidth;
    step = (conf.progressTotalWidth - conf.progressInitialWidth) / count;
    updateTime(count);
  }

  var step, instance;
  var progressEl = $('.timer-progress', el);
  var actions = {
    'start': {
      fn: function() {
        if (checkBeforeStart()) { return; }
        instance = interval(function() {
          progressWidth += step;
          progressEl.width(progressWidth);
          updateTime(--count);
          if (count === 0) {
            restart();
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
      fn: function() {
        reset();
      },
      className: 'normal'
    }
  };

  var actionKeys = _.keys(actions);
  var prevAction, actionIndex = 0;

  function run() {
    var action = actions[actionKeys[actionIndex]];
    var timerStart = $('.timer-start', el);
    if (prevAction) {
      timerStart.removeClass(prevAction.className);
    }
    timerStart.addClass(action.className);
    action.fn();

    actionIndex = (++actionIndex) % 3;
    prevAction = action;
  }
  
  function reset() {
    initSession(working ? 'break' : 'work');
    working = !working;
  }
  
  function restart() {
    run();
    run();
    reset();
    if (!settings.get('notification', 'popup') || !notify) { return; }
    var text = working ? '休息，休息一下！' : '开始工作了！';
    notify('时间到了', text);
  }

  function interval(callback) {
    var timer = setInterval(callback, 1000);
    return {
      stop: function() {
        clearInterval(timer);
      }
    };
  }

  function checkBeforeStart() {
    if (initial && connect.currentTasks.length === 0) {
      if(confirm('你不添加个任务先？')) {
        taskMod.focusInput();
        return true;
      }
    }
    initial = false;
  }


  //Util
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
    initialize: initialize,
    initSession : initSession,
    get active() {
      return active;
    }
  };

});
