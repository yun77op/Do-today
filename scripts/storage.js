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


	function set(key, val) {
		if (!_.isArray(key)) {
			key = [key];
		}

		var primaryKey = key[0], result, primary;
		result = primary = _get(primaryKey);

		var l = key.length;
		if (l == 1) {
			if (val) {
				primary = val;
			}
		} else {
			if (result == null) {
				result = primary = {};
			}
			for (var i = 1; i < l - 1; ++i) {
				if (result[key[i]] == null) {
					result[key[i]] = {};
				}
				result = result[key[i]];
			}

			if (val) {
				result[key[i]] = val;
			} else {
				result = result[key[i]];
			}

		}

		if (!val) {
			return result;
		}
		
		_set(primaryKey, primary);
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
		exports[name] = function() {
			var items = set(key), result;
			if (items) {
				result = _[name](items, cb);
				set(key, result);
			} 
		};
	});

	exports.set = set;
	exports.append = append;
	exports.remove = remove;
})