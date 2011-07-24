define(function(require, exports, module) {

    /* Based on Alex Arnell's inheritance implementation. */
    window.Class = {
      create: function() {
        var parent = null, properties = Array.prototype.slice.call(arguments);
        if (typeof properties[0] == 'function')
          parent = properties.shift();

        function klass() {
          this.initialize.apply(this, arguments);
        }

        _.extend(klass, Class.Methods);
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
        var properties = _.keys(source);

        if (!_.keys({ toString: true }).length)
          properties.push("toString", "valueOf");

        for (var i = 0, length = properties.length; i < length; i++) {
          var property = properties[i], value = source[property];
          if (ancestor && typeof value == 'function' && value.argumentNames()[0] == "$super") {
            var method = value, value = _.extend((function(m) {
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

    _.extend(Function.prototype, {
      argumentNames: function() {
        var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
          .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
          .replace(/\s+/g, '').split(',');
        return names.length == 1 && !names[0] ? [] : names;
      }
    });


    return  {
        _mods: {},
            
        initedMods: [],

        getMods: function() {
            return this._mods;
        },

        use: function(mod) {
            var o = this;

            if (!_.isArray(mod)) {
                mod = [mod];
            } else if (_.isString(mod) && arguments[1] !== undefined) {
                mod = {
                    mod: arguments[1]
                };
            }

            _.each(mod, function(mod_) {
                o._use(mod_);
            });
        },

        _use: function(mod) {
            _.extend(this._mods, mod);
        },

        _init: function() {
            var o = this,
                mods = o._mods,
                handles = _.keys(mods);

            (function next() {
                var handle = handles.shift(),
                    mod = mods[handle],
                    err = null;
                if (!mod) {
                    return;    
                }

                try {
                    mod.func.call(null, o, mod);
                } catch (e) {
                    err = e;
                }
                o.initedMods.push(handle);
                $(document).trigger('init:mod:' + handle);
                next(err, next);
            })();
        },

        init: function() {
            var o = this;
            $(document).trigger('init');
            $(document).ready(function() {
                o._init();
                $(document).trigger('init:domReady');
            });
            $(document).trigger('init:complete');
        }
    };
});