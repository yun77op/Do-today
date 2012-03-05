module.exports = function(app, db) {

  app.get('/login', function(req, res, next) {
    res.render('login');
  });
};