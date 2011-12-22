var util = require('./util'),
   https = require('https');

function OAuth2(id_, secret_, baseURI, redirectURI, authorizePath, accessPath) {
  this.id_ = id_;
  this.secret_ = secret_;
  this.baseURI_ = baseURI;
  this.redirectURI_ = redirectURI;
  this.authorizePath_ = '/oauth/authorize' || authorizePath;
  this.accessPath_ = '/oauth/access_token' || accessPath;
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

//{ "access_token":"SlAV32hkKG", "expires_in":3600, "refresh_token":"8xLOxBtZp8" }
p.getAccessToken = function (code, callback) {
  var path = util.addURLParam(this.accessPath_, {
    client_id: this.id_,
    client_secret: this.secret_,
    grant_type: 'authorization_code',
    redirect_uri: this.redirectURI_,
    code: code
  });

  var options = {
    path: path
  };

  this.request(options, function (data) {
    callback(data);
  });
};

p.request = function (path, options, params, access_token, callback) {
  var args = Array.prototype.slice.call(arguments, 1);
  callback = args.pop();
  options = args.shift() || {};
  params = args.shift() || {};
  var parsedURI = url.parse(this.baseURI_);
  options.host = parsedURI.host;
  options.method = options.method || 'GET';
  options.method = options.method.toUpperCase();
  if (options.method == 'GET') {
    path = util.addURLParam(path, params);
  }
  options.path = path;
  options.headers = {
    'Authorization': 'OAuth2' + ' ' + access_token
  };

  var req = https.request(options, function (res) {
    var result = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      result += chunk;
    });
    res.on('end', function () {
      var data = JSON.parse(result);
      callback(data);
    });
  });

  if (options.method == 'POST') {
    req.write(util.stringify(params));
  }

  req.end();
};

exports.OAuth2 = OAuth2;