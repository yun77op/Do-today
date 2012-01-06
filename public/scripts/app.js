define(function(require, exports, module) {
  

  Date.now = Date.now || function() {
    return new Date().getTime();
  };

  var initPlugins = require('./init_plugins');
  var settings = require('./settings');
  var timerMod = require('./timer');
  var taskMod = require('./task');

  function start() {
    for (var i in initPlugins) {
      initPlugins[i].fn();
    }

    timerMod.initialize('work');
    $('#mask').fadeOut();

    ////extra
    //tipsy
    $LAB
      .script('lib/jquery.tipsy.js')
      .wait(function() {
        $('.tipsy').tipsy();
        //taskMod depends tipsy
        taskMod.start();
      });
    //sound notification
    if (settings.get('notification', 'sound')) {
      $LAB
        .script('lib/soundmanager2-nodebug-jsmin.js')
        .wait(function() {
          soundManager.url = '../assets/';
          soundManager.onready(function(oStatus) {
            if (!oStatus.success) { return false; }
            var sound = soundManager.createSound({
              id: 'soundNotify',
              url: '../assets/notify.mp3'
            });
            $(document).bind('timer:complete', function(e) {
              sound.play();
            });
          });
          soundManager.beginDelayedInit();
        });
    }


  }

  return {
    start: start
  };

});