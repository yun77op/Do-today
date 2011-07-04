define(function(require, exports, module) {

    return  {
        initPlugins: {},
            
        initedPlugins: [],

        addInitPlugins: function(plugins) {
            _.extend(this.initPlugins, plugins);
        },

        _runPlugin: function(plugin, handle) {
            plugin.func.call(function() {}, this, plugin);
            this.initedPlugins.push(handle);
            $(document).trigger('init:plugin:' + handle, handle);
        },

        _checkDeps: function(deps, handle, plugin) {
            deps = _.without(deps, handle);
            if (deps.length == 0) {
                this._runPlugin(plugin, handle);
                return false;
            }
            return deps;
        },
        _initPlugins: function() {
            var o = this;
            _.each(this.initPlugins, function(plugin, handle) {
                var deps = plugin.deps
                if (plugin.deps) {
                    _.each(deps, function(dep) {
                        if (!~_.indexOf(o.initedPlugins, handle)) {
                            deps = o._checkDeps(deps, handle, plugin);
                        } else {
                            $(document).bind('init:plugin:' + dep, function(e, handle_) {
                                deps = o._checkDeps(deps, handle_, plugin);
                            });
                        }
                    });
                } else {
                    o._runPlugin(plugin, handle);
                }
            });
        },

        init: function() {
            var o = this;
            $(document).trigger('init');
            $(function() {
                o._initPlugins();
                $(document).trigger('init:domReady');
            });
            $(document).trigger('init:complete');
        }
    };
});
