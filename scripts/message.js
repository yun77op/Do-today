define(function(require, exports, module) {
    var Instances = {};

    var DEFAULTS = {
        interval: 2000,
        autoOpen: false,
        autoHide: false
    };


    var methodFunc = {
        text: function(text) {
            this.el.find('.message-text').text(text);
        },

        buttons: function(buttons) {
            var o = this;
            this.el.find('.ui-buttonset').remove();

            if ($.isEmptyObject(buttons)) {
                return;
            }

            var buttonset = $('<div class="ui-buttonset"></div>').appendTo(this.el);
            
            _.each(buttons, function(el, key) {
                var button = $('<button class="ui-button ui-state-default ui-corner-all ui-button-text-only" id="ui-button-' + key + '"><span class="ui-button-text">' + el.label + '</span></button>').appendTo(buttonset);
                button.click(_.bind(el.click, o));
            });
        }, 

        className: function() {
            this.el.addClass(this.option('className'));
        }
    };

    var Message = Class.extend({
        init: function(name, opts) {
            Instances[name] = this;
            var el = $('<div id="message-' + name + '" class="message"><span class="message-text"></span></div>');
            this.el = el.hide().appendTo('body');
            this.options = $.extend({}, DEFAULTS);
            opts && this.option(opts);

            _.bindAll(this, 'hide', 'show');

            if (this.option('autoOpen')) {
                this.show();
            }
            
        },

        show: function(autoHide) {
            autoHide === undefined && (autoHide = this.option('autoHide'));
            this.el.stop(true, false);
            this.el.show();
            if (autoHide) {
                this.addTimer();
            }
        },

        hide: function(text) {
            this.el.slideUp('slow');
        },

        addTimer: function() {
            this.timer = window.setTimeout(this.hide, this.option('interval'));
        },

        clearTimer: function () {
            if (this.timer) {
                window.clearTimeout(this.timer);
            }
        },

        option: function( key, value ) {
            var options = key;

            if ( arguments.length === 0 ) {
                // don't return a reference to the internal hash
                return $.extend( {}, this.options );
            }

            if  (typeof key === "string" ) {
                if ( value === undefined ) {
                    return this.options[ key ];
                }
                options = {};
                options[ key ] = value;
            }

            this._setOptions( options );

            return this;
        },
        
        _setOptions: function( options ) {
            var self = this;
            $.each( options, function( key, value ) {
                self._setOption( key, value );
            });

            return this;
        },
        
        _setOption: function( key, value ) {
            this.options[ key ] = value;

            methodFunc[key] && methodFunc[key].call(this, value);
            return this;
        }
    });

    return {
        generate: function (name, options) {
            var cur = Instances[name];
            if(cur) return cur;
            return new Message(name, options);
        }
    }
        
        

});
