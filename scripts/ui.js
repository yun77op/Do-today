
(function( $, undefined ) {


    var optionFunc = {
        'visible': function(isVisible) {
            if (!isVisible) {
                srcNode.addClass('ui-helper-hidden');
            } else {
                srcNode.removeClass('ui-helper-hidden');
            }
        },

        'host': function(host) {
            $(host).append(this.options.srcNode);
        },

        'srcNode': function(srcNode) {
            this.options.srcNode = $(srcNode);
        },

        'width': function(val) {
            this.options.srcNode.width(val);
        },
        
        'align': function( val ) {
            var node = val.node,
                points = val.points,
                o = $(this);

            var srcNodePoint = calcPoints(srcNode, -1)[points[0]],
                point = calcPoints(o, 1)[points[1]];
                base = o.offset();
            var result = [base.left + srcNodePoint[0] + point[0], base.top + srcNodePoint[1] + point[1]];

            srcNode.offset({
                left: result[0],
                top: result[1]
            });

            function calcPoints(el, direction) {
                var width = el.width() * direction,
                    height = el.height() * direction;
                
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
            host: null,
            visible: false,
            host: 'body'
        },

        _create: function() {
        
            if (this.options.srcNode) {
                this.options.srcNode = $('<div class="ui-overlay ui-helper-hidden" id="ui-overlay-' + $.guid() + '"></div>');
            }

            this._setupEvents();
        },
        _setOption: function( key, value ) {
            this._super( "_setOption", key, value);

            if ( key === "event" ) {
                this._setupEvents( value );
            }

            optionFunc[key] && optionFunc[key].call(this, value);
        },


        _setupEvents: function() {
            // attach tab event handler, unbind to avoid duplicates from former tabifying...
            this.element.unbind( ".overlay" );

            if ( event ) {
                this.element.bind( event.split( " " ).join( ".overlay " ) + ".overlay",
                    $.proxy( this, "_eventHandler" ) );
            }

            // disable click in any case
            this.element.bind( "click.overlay", function( e ){
                e.preventDefault();
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

   




(function() {


    var el = $('<input id="hotedit" style="position: absolute">');
        
    el.hide();
    
    $('body').append(el);


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

        var o = $(this);
        
        if (typeof arguments[0] == 'object') {
            initialize.call(this, arguments[0]);
            return;
        }
        
        var opts = o.data('hotedit');
            

        var methodHandle = {};

        var actionHandle = {
            'edit': function(cb) {
                !cb || (opts && (cb = opts.cb));
                var offset = o.offset();
                el.css({
                    left: offset.left,
                    top: offset.top,
                    width: o.width()
                });
                el.show().val(o.text());
                el[0].select();
                edit.call(o, cb);
            },

            'option': function(opt) {
                _.each(opt, function(val, key) {
                    methodHandle[key].call(o, val);
                });
            }
        };
        
        var action = arguments[0];
        actionHandle[action].apply(this, Array.prototype.slice.call(arguments, 1));
        
    };

    
})();