function isEmptyObject(obj) {
	for ( var key in obj ) {
		return false;
	}
	return true;
}

function addURLParam(url, key, value) {
	if (typeof key == 'object') {
		var obj = key;
		if (!isEmptyObject(obj)) {
			return url + '?' + stringify(obj);
		}
	} else {
		var sep = (url.indexOf('?') >= 0) ? "&" : "?";
		return url + sep + toRfc3986(key) + "="
				+ toRfc3986(value);
	}
	return url;
}

function stringify(obj) {
	var result = '';
	for (var key in obj) {
		result += toRfc3986(key) + '=' + toRfc3986(obj[key]) + '&';
	}
	return result.slice(0, -1);
}


exports.stringify = stringify;
exports.addURLParam = addURLParam;

exports.isEmptyObject = isEmptyObject;