/*jshint node: true */
'use strict';

var l = require('../middleware/layout');
var s = require('../lib/shared');

/**
 * [exports description]
 * @param  {[type]} app [description].
 */
module.exports = function(app) {

  var aboutPage = l.topLevelPages.about;

  /*
  GET /about
  */
  app.get(aboutPage.routePattern, l.forTopLevelPage(aboutPage),
    function(req, res) {
      s.getAboutViewModel(function(err, model) {
      res.render(aboutPage.pageTemplateName, model);
    });
  });
};
