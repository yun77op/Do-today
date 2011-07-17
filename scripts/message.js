define(function(require, exports, module) {

    var Instances = {};

    var DEFAULTS = {
        interval: 2000,
        autoOpen: false,
        text: '',
        autoHide: false
    };



    var Message = Class.create({
        initialize: function(name, opts) {
            Instances[name] = this;
            var el = $('<div id="message-' + name + '" class="message notice"><span class="message-text"></span></div>');
            this.el = el.hide().appendTo('body');
            _.extend(this, DEFAULTS);
            this.options(opts);

            if (this.autoOpen) {
                this.show();
            }
            _.bindAll(this, 'hide');
        },

        show: function(text, autoHide) {
            if (arguments.length == 1 && typeof text == 'boolean') {
                autoHide = text;
                text = this.text;
            }
            text === undefined && (text = this.text);
            autoHide === undefined && (autoHide = this.autoHide);
            this.el.stop(true, false);
            this.el.find('.message-text').text(text).end().show();
            if (autoHide) {
                this.addTimer();
            }
        },

        hide: function(text) {
            this.el.slideUp('slow');
        },

        addTimer: function() {
            this.timer = window.setTimeout(this.hide, this.interval);
        },

        clearTimer: function () {
            if (this.timer) {
                window.clearTimeout(this.timer);
            }
        },

        options: function(opts) {
            _.extend(this, opts);
            var o = this;
            if (this.buttons) {
                var buttonset = this.el.find('.ui-buttonset');
                if ($.isEmptyObject(this.buttons)) {
                    buttonset.remove();
                    return;
                }

                if (buttonset.length == 0) {
                    buttonset = $('<div class="ui-buttonset"></div>').appendTo(o.el); 
                }
                
                buttonset.empty();
                
                _.each(this.buttons, function(el, key) {
                    var button = $('<button class="ui-button ui-state-default ui-corner-all ui-button-text-only" id="ui-button-' + key + '"><span class="ui-button-text">' + el.label + '</span></button>').appendTo(buttonset);
                    button.click(_.bind(el.click, o));
                });
            }
        }

    });


    return {
        generate: function (name, opts) {
            var cur = Instances[name];
            if(cur) return cur;
            return new Message(name, opts);
        }
    }
        
        

});
