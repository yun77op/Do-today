(function() {

    

    $.fn.overlay = function() {

        var o = $(this);
        var srcNode = $(o.data('ui-overlay-srcNode'));

        var methodHandle = {
            'align': function(val) {
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
                        'LB': [width, 0],
                        'RT': [0, height],
                        'RB': [width, height]
                    };
                }

            },

            'width': function(val) {
                srcNode.width(val);
            },

            'visible': function(isVisible) {
                if (!isVisible) {
                    srcNode.addClass('ui-helper-hidden');
                } else {
                    srcNode.removeClass('ui-helper-hidden');
                }
                
            },

            'host': function(host) {
                $(host).append(srcNode);
            },

            'srcNode': function(srcNode_) {
                srcNode = $(srcNode_);
                o.data('ui-overlay-srcNode', srcNode_);
            },

            'show': function(fn) {
                o.unbind('overlayshow').bind('overlayshow', function() {
                    $(document).one('click', function() {
                        o.overlay('hide');
                    });  
                }).bind('overlayshow', fn);
            },

            'hide': function(fn) {
                o.unbind('overlayhide').bind('overlayhide', fn);
            }
        };

        var actionHandle = {
            'show': function() {
                srcNode.removeClass('ui-helper-hidden');
                o.trigger('overlayshow', arguments);
            },

            'hide': function() {
                srcNode.addClass('ui-helper-hidden');
                o.trigger('overlayhide', arguments);
            },

            'toggle': function() {
                srcNode.toggleClass('ui-helper-hidden');
                var status = srcNode.is(':hidden') ? 'overlayhide' : 'overlayshow';
                o.trigger(status, arguments);
            },

            'option': function(opt) {
                _.each(opt, function(val, key) {
                    methodHandle[key].call(o, val);
                });
            }
        };

    
        if (typeof arguments[0] == 'object') {
            initialize(arguments[0]);   
        } else {
            var action = arguments[0];
            actionHandle[action].apply(this, Array.prototype.slice.call(arguments, 1));
        }
         
        return this;

        function initialize(opts) {
            var DEFAULTS = {
                srcNode: null,
                host: null,
                visible: false,
                host: 'body'
            };

            opts = $.extend(DEFAULTS, opts);

            
            if ($(opts.srcNode).length == 0) {
                opts.srcNode = $('<div class="ui-overlay ui-helper-hidden" id="ui-overlay-' + $.guid() + '"></div>');
            }

            o.overlay('option', opts);

        }

    };
 
})();





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