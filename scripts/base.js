var Class = {
  create: function() {
    var parent = null, properties = Array.prototype.slice.call(arguments);
    if (typeof properties[0] == 'function')
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      var subclass = function() { };
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0; i < properties.length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = this.emptyFunction;

    klass.prototype.constructor = klass;

    return klass;
  },
  emptyFunction:function () {},

};

Class.Methods = {
  addMethods: function(source) {
    var ancestor   = this.superclass && this.superclass.prototype;
    var properties = Object.keys(source);

    if (!Object.keys({ toString: true }).length)
      properties.push("toString", "valueOf");

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames().first() == "$super") {
        var method = value, value = Object.extend((function(m) {
          return function() { return ancestor[m].apply(this, arguments) };
        })(property).wrap(method), {
          valueOf:  function() { return method },
          toString: function() { return method.toString() }
        });
      }
      this.prototype[property] = value;
    }

    return this;
  }
};

Object.extend = function(destination, source) {
  for (var property in source)
    destination[property] = source[property];
  return destination;
};


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
