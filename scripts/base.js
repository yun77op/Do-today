define(function(require, exports, module) {
	var app = {
		use: use
	};

	function use(plugins, DOMready) {
		_.each(plugins, function(plugin, key) {
			_use(key, plugin, DOMready);
		});
		
		return this;
	}

	function _use(key, plugin, DOMready) {
		var fn = plugin.fn,
				fnWrapper = function() {
					fn.call(null, app, plugin);
				};
		app[key] = plugin;
		if (DOMready) {
			$(fnWrapper);
		} else {
			fnWrapper();
		}
	}

	return app;
});