var querystring = require('querystring');

var stringify = querystring.stringify;

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
    return url + sep + toRfc3986(key) + "=" +
      toRfc3986(value);
  }
  return url;
}

function toRfc3986(val) {
  return encodeURIComponent(val).replace(/\!/g, "%21").replace(/\*/g, "%2A")
    .replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");
}

function extend(target, obj) {
  if (obj instanceof Object && obj) {
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        target[attr] = obj[attr];
      }
    }
  }
  return target;
}


exports.stringify = stringify;
exports.addURLParam = addURLParam;

exports.isEmptyObject = isEmptyObject;
exports.extend = extend;