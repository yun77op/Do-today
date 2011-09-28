define(function(require, exports, module) {
	var Instances = {};

	Message = function() {
		this.initialize.apply(this, arguments);
	}

	Message.prototype = {
		initialize: function(name, options) {
			Instances[name] = this;
			var el = $('<div id="message-' + name + '" class="message"><span class="message-text"></span></div>');
			this.el = el.hide().appendTo('body');
			this.options = $.extend({}, Message.defaults);
			options && this.option(options);

			_.bindAll(this, 'hide', 'show');
			if (this.option('autoOpen')) {
				this.show();
			}
		},

		show: function(text, autoHide) {
			if (typeof text == 'boolean') {
				autoHide = text;
				text = null;
			}
			autoHide === undefined && (autoHide = this.option('autoHide'));
			text != null && this.option('text', text);
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
			Message.fn[key] && Message.fn[key].call(this, value);
			return this;
		}
	};

	$.extend(Message, {
		defaults: {
			interval: 2000,
			autoOpen: false,
			autoHide: false
		},

		fn: {
			text: function(text) {
				this.el.find('.message-text').text(text);
			},

			actions: function(obj) {
				var self = this;
				this.el.find('.actions').remove();

				if (!obj || $.isEmptyObject(obj)) { return; }

				var actions = $('<div class="actions"></div>');
				$.each(obj, function(key, val) {
					var action = $('<a href="#">' + val.label + '</a>').appendTo(actions);
					action.click(function(e) {
						e.preventDefault();
						val.click.call(self);
					});
				});
				actions.appendTo(this.el);
			}, 

			className: function(className) {
				this.el.addClass(className);
			}
		} 
	});

	return {
		generate: function (name, options) {
			var cur = Instances[name];
			if(cur) { return cur; }
			return new Message(name, options);
		}
	}

});
