module.exports = function(app, db) {
  app.get('/', loadUser, function (req, res) {
    if (req.currentUser) {
      res.redirect('/app');
    } else {
      res.render('login', {
        locals: {
          title: '登陆 Dotoday'
        }
      });
    }
  });
}
