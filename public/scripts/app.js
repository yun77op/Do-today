define(function(require, exports, module) {

  Date.now = Date.now || function() {
    return new Date().getTime();  
  };

  var initPlugins = require('./init_plugins'),
            timer = require('./timer');

  function start() {
    for (var i in initPlugins) {
      initPlugins[i].call(null);  
    }

    timer.initialize('work');
    $('.tipsy').tipsy();
    $('#mask').fadeOut(); 
  }

  return {
    start: start
  };

});