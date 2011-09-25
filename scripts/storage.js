define(function(require, exports, module) {

	if (typeof localStorage == 'undefined') {
		
		localStorage = {
			userData : null,
			name : location.hostname,

			init:function(){
				if (!localStorage.userData) {
					try {
						localStorage.userData = document.createElement('INPUT');
						localStorage.userData.type = "hidden";
						localStorage.userData.style.display = "none";
						localStorage.userData.addBehavior ("#default#userData");
						document.body.appendChild(localStorage.userData);
						var expires = new Date();
						expires.setDate(expires.getDate()+365);
						localStorage.userData.expires = expires.toUTCString();
					} catch(e) {
						return false;
					}
				}
				return true;
			},

			setItem : function(key, value) {
				if(localStorage.init()){
					localStorage.userData.load(localStorage.name);
					localStorage.userData.setAttribute(key, value);
					localStorage.userData.save(localStorage.name);
				}
			},

			getItem : function(key) {
				if(localStorage.init()) {
					localStorage.userData.load(localStorage.name);
					return localStorage.userData.getAttribute(key);
				}
			},

			removeItem : function(key) {
				if(localStorage.init()){
					localStorage.userData.load(localStorage.name);
					localStorage.userData.removeAttribute(key);
					localStorage.userData.save(localStorage.name);
				}

			}
		};

	}


	function _get(key) {
		var val = localStorage.getItem(key);
		try {
			val = JSON.parse(val);
			return val;
		} catch (e) {
			
		}
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
		if (len != 1) {
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
})