module.exports = function(app, db) {
  app.get('/', function (req, res) {
    res.render('index', {
      locals: {
        title: 'Dotoday'
      }
    });
  });
};
