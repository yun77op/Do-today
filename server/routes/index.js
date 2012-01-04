module.exports = function(app, db) {
  app.get('/', function (req, res) {
    if (req.isLoggedIn) {
      res.redirect('/app');
    } else {
      res.render('index');
    }
  });
};
