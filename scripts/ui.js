(function($) {
	var optionFn = {
		'visible': function(isVisible) {
			this.options.srcNode[!isVisible ? 'addClass' : 'removeClass' ]
					('ui-helper-hidden');
		},

		'width': function(val) {
			this.options.srcNode.width(val);
		},
		
		'align': function( val ) {
			var node = val.node || this.element,
					points = val.points;

			var srcNodePoint = calcPoints(this.options.srcNode, -1)[points[0]],
					point = calcPoints(this.element, 1)[points[1]],
					base = this.element.offset();
			var result = [base.left + srcNodePoint[0] + point[0], base.top +
					srcNodePoint[1] + point[1]];

			if (this.options.offset) {
				result[0] += this.options.offset[0];
				result[1] += this.options.offset[1];
			}
			
			this.options.srcNode.offset({
				left: result[0],
				top: result[1]
			});

			function calcPoints(el, direction) {
				var width = el.outerWidth() * direction,
						height = el.outerHeight() * direction;
				return {
					'LT': [0, 0],
					'LB': [0, height],
					'RT': [width, 0],
					'RB': [width, height]
				};
			}
		}
	};

	$.widget( 'ui.overlay', {
		version: '@VERSION',
		options: {
			event: 'click',
			srcNode: null,
			visible: false
		},

		_create: function() {
			if (!this.options.srcNode) {
				this.options.srcNode = '<div class="ui-overlay ui-helper-hidden" id="' +
						_.uniqueId('ui-overlay-') + '"></div>';
			}
			this.options.srcNode = $(this.options.srcNode).appendTo('body');
			this._process();
			this._setupEvents(this.options.event);
		},

		_setOption: function( key, value ) {
			this._super( "_setOption", key, value);

			if ( key === "event" ) {
				this._setupEvents( value );
			}

			this.__process(key, value);
		},

		_process: function() {
			var keys = _.keys(optionFn),
					self = this;
			_.each(keys, function(key) {
				if (typeof self.options[key] !== 'undefined') {
					self.__process(key, self.options[key]);    
				}
			});
		},

		__process: function(key, value) {
			optionFn[key] && optionFn[key].call(this, value);
		},

		_setupEvents: function(event) {
			// attach tab event handler, unbind to avoid duplicates from former tabifying...
			this.element.unbind( ".overlay" );

			if ( event ) {
				this.element.bind( event.split( " " ).join( ".overlay " ) + ".overlay",
					$.proxy( this, "_eventHandler" ) );
			}

			// disable click in any case
			this.element.bind( "click.overlay", function( e ) {
				e.preventDefault();
				e.stopPropagation();
			});

			this.options.srcNode.bind( "click.overlay", function( e ) {
				e.preventDefault();
				e.stopPropagation();
			});
		},

		_eventHandler: function() {
			this.show();
		}
	});


	$.extend($.ui.overlay.prototype, {
		'show': function() {
			var self = this;
			this.option('visible', true);
			this._trigger('show');
			$(document).one('click', function() {
				self.hide();
			});
		},

		'hide': function(fn) {
			this.option('visible', false);
			this._trigger('hide');
		}
	});

})(jQuery);


(function($) {
	var el = $('<input id="hotedit" style="position: absolute">').hide()
			.appendTo('body');

	function initialize(opts) {
		var DEFAULTS = {
			cb: $.noop
		};
		opts = $.extend(DEFAULTS, opts);
		$(this).data('hotedit', opts);
	}

	function hide() {
		el.hide();
	}

	function edit(cb) {
		el.unbind('blur').bind('blur', function() {
			complete();
		}).unbind('keyup').bind('keyup', function(e) {
			if (e.which == 13) {
				complete();
			}
		});

		function complete() {
			var text = el.val();
			hide(el);
			cb(text);
		}

		el.width($(this).parent().width());
	}

	$.fn.hotedit = function() {
		var el = $(this);	
		if (typeof arguments[0] == 'object') {
			initialize.call(this, arguments[0]);
			return;
		}
	
		var opts = el.data('hotedit');
		var methodHandle = {};
		var actionHandle = {
			'edit': function(cb) {
				!cb || (opts && (cb = opts.cb));
				var offset = el.offset();
				el.css({
					left: offset.left,
					top: offset.top,
					width: el.width()
				});
				el.show().val(el.text());
				el[0].select();
				edit.call(el, cb);
			},

			'option': function(opt) {
				_.each(opt, function(val, key) {
					methodHandle[key].call(el, val);
				});
			}
		};
		
		var action = arguments[0];
		actionHandle[action].apply(this, Array.prototype.slice.call(arguments, 1));
	};
	
})(jQuery);