module.exports = function(app, db) {

  app.get('/session/new', function(req, res, next) {
    res.render('session/new');
  });

  app.get('/session', function(req, res, next) {
    
    res.send('ok');
  });

  app.del('/session', function (req, res, next) {
    req.session.destroy(function (err) {
      if (err) return next(err);
      res.redirect('home');
    });
  });

};