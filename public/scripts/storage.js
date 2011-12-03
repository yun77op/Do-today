define(function(require, exports, module) {
	function _get(key) {
		return JSON.parse(localStorage.getItem(key));
	}

	function _set(key, val) {
		localStorage.setItem(key, JSON.stringify(val));
	}

	function set(path, val) {
		if (!_.isArray(path)) {
			path = [path];
		}

		var primaryPath = path[0],
				result = _get(primaryPath);

		var len = path.length;
		if (len > 1) {
			if (result == null) {
				result = {};
			}
			for (var i = 1; i < len - 1; ++i) {
				if (result[path[i]] == null) {
					if (val) {
						result[path[i]] = {};
					} else {
						return null;
					}
				}
				result = result[path[i]];
			}
			if (val) {
				result[path[i]] = val;
			} else {
				result = result[path[i]];	
			}
		} else {
			if (val) {
				result = val;
			}
		}

		if (val) {
			_set(primaryPath, result);
		} else {
			return result;
		}
	}

	function append(key, val_) {
		var val = set(key);
		if (val) {
			val.push(val_);
		} else {
			val = [val_];
		}
		set(key, val);
	}

	function modify(key, callback) {
		var val = set(key);
		val = callback(val);
		set(key, val);
	}

	function remove(key) {
		localStorage.removeItem(key);
	}

	_.each(['map', 'filter'], function(name) {
		exports[name] = function(key, callback) {
			var items = set(key), result;
			if (items) {
				result = _[name](items, callback);
				set(key, result);
			}
		};
	});

	exports.set = set;
	exports.append = append;
	exports.remove = remove;
	exports.modify = modify;
})