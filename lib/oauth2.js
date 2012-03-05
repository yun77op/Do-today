var https = require('https'),
    url = require('url'),
    util = require('./util');
function OAuth2(id_, secret_, baseURI, redirectURI, authorizePath, accessPath) {
  this.id_ = id_;
  this.secret_ = secret_;
  this.baseURI_ = baseURI;
  this.redirectURI_ = redirectURI;
  this.authorizePath_ = authorizePath || '/oauth/authorize';
  this.accessPath_ = accessPath || '/oauth/access_token';
}
var p = OAuth2.prototype;
p.getAuthorizeURL = function () {
  var authorizeURI = this.baseURI_ + this.authorizePath_;
  return util.addURLParam(authorizeURI, {
    client_id: this.id_,
    response_type: 'code',
    redirect_uri: this.redirectURI_
  });
};
p.getAccessToken = function (code, callback) {
  var options = {
    path: this.accessPath_,
    method: 'POST'
  };
  var params = {
    client_id: this.id_,
    client_secret: this.secret_,
    grant_type: 'authorization_code',
    redirect_uri: this.redirectURI_,
    code: code
  };
  this.request(options, params, function (err, data) {
    callback(err, data);
  });
};
/**
 * 不同的参数组合
 * 1 options, params, callback
 * 2 options, callback
 * 3 options, accessToken, callback
 */
p.request = function (options, params, accessToken, callback) {
  var args = Array.prototype.slice.call(arguments, 1);
  callback = args.pop();
  params = args.shift() || {};
  if (typeof params == 'string') {
    accessToken = params;
    params = {};
  } else {
    accessToken = args.shift() || null;
  }
  var parsedURI = url.parse(this.baseURI_);
  options.host = parsedURI.hostname;
  options.method = options.method || 'GET';
  options.method = options.method.toUpperCase();
  options.port = options.port || 443;
  var hasPostBody = !util.isEmptyObject(params) && options.method == 'POST';
  if (hasPostBody) {
    var postBody = util.stringify(params);
  }
  var headers = {
    'content-type': 'application/x-www-form-urlencoded',
    'host': options.host,
    'content-length': hasPostBody ? Buffer.byteLength(postBody) : 0
  };
  options.headers = options.headers || {};
  util.extend(options.headers, headers);
  if (options.method == 'GET') {
    if (accessToken) {
      params.access_token = accessToken;
    }
    options.path = util.addURLParam(options.path, params);
  }
  var req = https.request(options, function (res) {
    var result = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      result += chunk;
    });
    res.on('end', function () {
      var data = JSON.parse(result);
      if (res.statusCode != 200 && res.statusCode != 301 && res.statusCode != 302) {
        callback({ statusCode: res.statusCode, data: data });
      } else {
        callback(null, data);
      }
    });
  });
  req.on('error', function(e) {
    callback(e);
  });
  if (hasPostBody) {
    req.write(postBody);
  }
  req.end();
};
exports.OAuth2 = OAuth2;