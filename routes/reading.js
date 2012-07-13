/*jshint node: true */

module.exports = function(app) {

	var s = require('../lib/shared');

	app.get('/reading', function index (req, res) {
		s.getReadingListViewModel(function (error, viewModel) {
			if (error) throw error;
			res.render(viewModel.pageTemplateName, viewModel);
		});
	});

	app.get('/reading/tags/:tagName', function tag (req, res) {
		var tagName = req.params.tagName;
		s.getReadingTagViewModel(tagName, function (error, viewModel) {
			if (error) throw error;
			res.render(viewModel.pageTemplateName, viewModel);
		});
	});

};
