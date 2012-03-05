var config = require('../config.json');
var async = require('async');
var OAuth2 = require('../lib/oauth2').OAuth2;
var oauth2 = new OAuth2(config.oauth.client_id, config.oauth.client_secret,
                        config.oauth.base_uri, config.server.base_uri + '/callback',
                        '/oauth2/authorize', '/oauth2/access_token');
var models = require('../models');

module.exports = function(app, db) {

  app.get('/authorize', function(req, res) {
    res.redirect(oauth2.getAuthorizeURL());
  });

  app.get('/callback', function(req, res, next) {
    var UserModel = models(db, 'User');

    async.waterfall([
      function getAccessToken(callback) {
        var parsedUrl = require('url').parse(req.url, true);
        var code = parsedUrl.query.code;
        oauth2.getAccessToken(code, function(err, data) {
          var accessToken = data.access_token;
          callback(err, accessToken);
        });
      },

      function getUid(accessToken, callback) {
        oauth2.request({ path: '/2/account/get_uid.json' }, accessToken,
          function (err, data) {
            callback(err, accessToken, data.uid);
          }
        );
      },

      function checkExsitUser(accessToken, uid, callback) {
        UserModel.findById(uid, function(err, user) {
          if (err) callback(err);
          else if (!user) {
            callback(null, accessToken, uid);
          } else {
            doFinalAction(user.toObject());
          }
        });
      },

      function getUserInfo(accessToken, uid, callback) {
        oauth2.request({ path: '/2/users/show.json' }, {uid: uid}, accessToken,
          function (err, data) {
            callback(err, data);
          }
        );
      },

      function saveUser(userData, callback) {
        var user = new UserModel();
        user._id = userData.id;
        user.name = userData.name;
        user.profile_image_url = userData.profile_image_url;
        user.access_token = accessToken;
        user.save(function(err) {
          if (err) return callback(err);
          doFinalAction(user.toObject());
        });
      }
    ], function(err) {
      if (err) next(err);
    });

    function doFinalAction(user) {
      req.session.user = user;
      res.redirect('/app');
    }

  });
};