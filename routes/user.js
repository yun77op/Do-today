var models = require('../models');

module.exports = function(app, db) {

  app.get('/signup', function(req, res, next) {
    res.render('signup', {
      user: {}
    });
  });

  app.post('/signup', function(req, res, next) {
    var UserModel = models(db, 'User');
    var user = new UserModel(req.body);

    function userSaveFailed(err) {
      req.flash('error', err.toString());
      res.render('signup', {
        user: user
      });
    }

    user.save(function(err) {
      if (err) return userSaveFailed(err);

      req.flash('info', 'Your account has been created');
      req.session.user_id = user.id;
      res.redirect('/app');
    });
  });


  app.del('/user', function (req, res, next) {
    // delete user
  });

};