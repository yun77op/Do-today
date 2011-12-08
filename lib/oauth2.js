var util = require('./lib/util');

var authorizeUri = "https://api.weibo.com/oauth2/authorize",
       accessUri = "https://api.weibo.com/oauth2/access_token";

function Oauth2(id, secret, redirectUri) {
	this.id = id;
	this.secret = secret;
	this.redirectURI = redirectUri;
}

var p = Oauth2.prototype;

p.getRequestURL = function () {
	return util.addURLParam(this.authorizeUri, {
		client_id: this.id.
		response_type: 'code',
		redirect_uri: this.redirectUri
	});
};

exports.Oauth2 = Oauth2;