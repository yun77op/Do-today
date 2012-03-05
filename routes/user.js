var models = require('../models');

module.exports = function(app, db) {

  app.get('/signup', function(req, res, next) {
    res.render('signup');
  });

  app.post('/signup', function(req, res, next) {
    var UserModel = models(db, 'User');
    var user = new UserModel(req.body);
    user.save(function(err){

      res.redirect('/');
    });
  });


  app.del('/user', function (req, res, next) {
    // delete user
  });

};