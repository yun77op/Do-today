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
      autoOpen: false,
      position: {
        at: 'left top',
        my: 'right bottom'
      }
    },

    _create: function() {
      var options = this.options;
      options.srcNode = $(options.srcNode);
      this._setupEvents(options.event);
      if (!options.autoOpen) {
        this.close();
      }
    },

    _setOption: function(key, value) {
      switch (key) {
        case 'event':
          this._setupEvents(value);
          break;
        case 'zIndex':
          this.element.css('z-index', value);
          break;
        case 'position':
          $.extend(this.options.position, value);
          this._position();
          return;
      }
      this._super('_setOption', key, value);
    },

    _setupEvents: function(event) {
      this.element.unbind( ".overlay" ).bind( event.split( " " ).join( ".overlay " ) + ".overlay",
          $.proxy( this, "open" ) );

      // disable click in any case
      this.element.bind( "click.overlay", function( e ) {
        e.preventDefault();
        e.stopPropagation();
      });
    },
    
    _position: function() {
      var option = $.extend({
        of: this.element
      }, this.options.position);

      this.options.srcNode.position(option);
    }
  });


  $.extend($.ui.overlay.prototype, {
    'open': function() {
      var self = this,
          srcNode = this.options.srcNode;
      srcNode.show();
      this._position();
      this._trigger('open');
      $(document).bind('click.overlay', function(e) {
        if ($(e.target).closest(srcNode).length === 0) {
          $(this).unbind(e);
          self.close();
        }
      });
    },

    'close': function(fn) {
      this.options.srcNode.hide();
      this._trigger('close');
    }
  });

})(jQuery);