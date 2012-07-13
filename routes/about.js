/*jshint node: true */

module.exports = function(app) {

	var s = require('../lib/shared');

	app.get('/about', function(req, res) {
		s.getAboutViewModel(function (err, model) {
			res.render(model.pageTemplateName, model);
		});

	});

};
