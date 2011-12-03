(function($) {
	var input = $('<input id="hotedit" style="position: absolute">')
		.hide().appendTo('body'), selectedOpts;

	input.bind('blur', function(e) {
		_complete();
	}).bind('keyup', function(e) {
		if (e.which == 13) {
			_complete();
		}
	});

	function _complete() {
		var text = input.hide().val();
		selectedOpts.callback(text);
	}

	function _start(el) {
		el = $(el);
		selectedOpts = el.data('hotedit');
		var offset = el.offset();
		input.css({
			left: offset.left,
			top: offset.top,
			width: el.parent().width()
		});
		input.show().val(el.text());
		input[0].select();
	}

	var defaults = {
		callback: $.noop
	};

	$.fn.hotedit = function(options) {
		var el = $(this);
		if (el.length) { 
			options = $.extend({}, defaults, options);
			el.data('hotedit', options);
			el.unbind('click.he').bind('click.he', function(e) {
				e.preventDefault();
				_start(this);
			});
		}
		return this;
	};
	
})(jQuery);