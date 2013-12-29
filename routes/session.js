var models = require('../models');

module.exports = function(app, db) {

  app.get('/session/new', function(req, res, next) {
    res.render('session/new');
  });

  app.post('/session', function(req, res, next) {
    var User = models(db, 'User');
    User.find({ email: req.body.email }, function(err, users) {
      if (err) {
        res.render('session/new', {
          messages: {
            error: err.toString()
          }
        });
        return;
      }

      if (users.length === 0) {
        res.render('session/new', {
          messages: {
            error: 'No such user'
          }
        });
        return;
      }

      var user = users[0];

      if (user.authenticate(req.body.pass)) {
        req.session.user = {
          id: user.get('id'),
          name: user.get('name')
        };
        res.redirect('/app');
      } else {
        res.render('session/new', {
          messages: {
            error: 'Password do not match email.'
          }
        });
      }
    });
  });

  app.get('/session/del', function (req, res, next) {
    req.session = null;
    res.redirect('/');
  });

};