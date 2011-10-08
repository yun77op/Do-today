/**
 * @fileoverview jQuery Overlay
 * Depends
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 *   jquery.ui.position.js
 */

(function($) {
	$.widget( 'ui.overlay', {
		version: '@VERSION',
		options: {
			event: 'click',
			srcNode: null,
			autoOpen: false
		},

		_create: function() {
			var options = this.options;
			if (!options.srcNode) {
				options.srcNode = '<div class="ui-overlay ui-helper-hidden"></div>';
			}
			options.srcNode = $(options.srcNode).appendTo('body');
			this._setupEvents(options.event);

			if (options.autoOpen) {
				this.show();
			}
		},
		
		_position: function() {
			$(this).position({
				of: ''
			});
		},

		_setOption: function(key, value) {
			switch (key) {
				'event':
					this._setupEvents(value);
					break;
				'visible': 
					this.options.srcNode[!value ? 'addClass' : 'removeClass']('ui-helper-hidden');
					break;
				'position':
					$.extend(this.options.position, value);

					return;
			}
			this._super('_setOption', key, value);
		},

		_setupEvents: function(event) {
			// attach tab event handler, unbind to avoid duplicates from former tabifying...
			this.element.unbind( ".overlay" );

			if ( event ) {
				this.element.bind( event.split( " " ).join( ".overlay " ) + ".overlay",
					$.proxy( this, "show" ) );
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