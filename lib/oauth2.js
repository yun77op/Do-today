var util = require('./util'),
   https = require('https');

function Oauth2(id, secret, redirectUri) {
  this.id = id;
  this.secret = secret;
  this.redirectUri = redirectUri;
}

var p = Oauth2.prototype;

p.getAuthorizeURL = function () {
  var authorizeUri = "https://api.weibo.com/oauth2/authorize";
  return util.addURLParam(authorizeUri, {
    client_id: this.id,
    response_type: 'code',
    redirect_uri: this.redirectUri
  });
};

//{ "access_token":"SlAV32hkKG", "expires_in":3600, "refresh_token":"8xLOxBtZp8" }
p.getAccessToken = function (code, callback) {
  var uri = util.addURLParam({
    client_id: this.id,
    client_secret: this.secret,
    grant_type: 'authorization_code',
    redirect_uri: this.redirectUri,
    code: code
  });

  var options = {
    host: 'api.weibo.com',
    path: '/oauth2/access_token'
  };

  var req = https.get(options, function (res) {
    var result = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      result += chunk;
    });
    res.on('end', function () {
      var data = JSON.parse(result);
      this.data = data;
      callback(data);
    });
  });
};

exports.Oauth2 = Oauth2;