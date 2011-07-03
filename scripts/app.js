define(function(require, exports, module) {
    var app = {};

    app.init = function() {
        $(document).trigger('init');
        $(function() {
            require.async('./mvc.js', function() {});
            $(document).trigger('init:domReady');
        });
        $(document).trigger('init:complete');
    };

    return app;
});
