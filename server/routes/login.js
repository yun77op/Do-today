var config = require('../config');

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
    var parsedUrl = require('url').parse(req.url, true);
    var code = parsedUrl.query.code;
    var accessToken;
    oauth2.getAccessToken(code, function(err, data) {
      if (err) next(err);
      accessToken = data.access_token;
      getUid(function(uid) {
        checkExistUser(uid, function(user) {
          if (user) {
            doFinalAction(user.toObject());
          } else {
            getUserInfo(uid, function(userData) {
              saveUser(userData, function(userDataReturn) {
                doFinalAction(userDataReturn);
              });
            });
          }
        });
      });
    });
          
    function doFinalAction(userData) {
      req.session.user = userData;
      res.redirect('/app');
    }

    function saveUser(userData, fn) {
      var user = new UserModel();
      user._id = userData.id;
      user.name = userData.name;
      user.profile_image_url = userData.profile_image_url;
      user.access_token = accessToken;
      user.save(function () {
        fn(user.toObject());
      });
    }

    function checkExistUser(uid, fn) {
      UserModel.findById(uid, function(err, user) {
        if (err) next(err);
        fn(user);
       });
    }

    function getUid(fn) {
      oauth2.request({ path: '/2/account/get_uid.json' }, accessToken,
        function (err, data) {
          if (err) next(err);
          fn(data.uid);
        }
      );
    }

    function getUserInfo(uid, fn) {
      oauth2.request({ path: '/2/users/show.json' }, {uid: uid}, accessToken,
        function (err, data) {
          if (err) next(err);
          fn(data);
        }
      );
    }

  });
};