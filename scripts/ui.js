define(require, exports, module) { 
    return {
        func: function() {
            $('.ui-close').click(function(e) {
                e.preventDefault();
                $(this).parent().hide();
            });


        }, 

        modules: {
            overlay: function() {
                
                $(document).bind(handle, function(e) {
                    uiEnhanced.unbind(handle);
                    $(this).unbind(handle);
                    $('.ui-overlay').hide();
                });
            },
            slide: function() {
                $('.ui-slide-hd').click(function(e) {
                    $(this).sibings('.ui-slide-hd').slideToggle();
                });
            }
        }
    }
};