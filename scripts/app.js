define(function(require, exports, module) {


    var app = require('./base');
    var initPlugins = require('./init_plugin');
    app.addInitPlugins(initPlugins);

    window.app = app;
    return app;
});
