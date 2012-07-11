var s = require('../lib/shared');

var Reading = (function Reading() {

	function Constructor() {}

	function index(req, res) {
		s.getReadingListViewModel(function(error, viewModel) {
			if (error) throw error;
			res.render(viewModel.pageTemplateName, viewModel);
		});
	}

	function tag(req, res) {

		var tagName = req.params.tagName;
		s.getReadingTagViewModel(tagName, function gotTagViewModel(error, viewModel) {
			if (error) throw error;
			res.render(viewModel.pageTemplateName, viewModel);
		});
	}

	Constructor.prototype = {
		tag: tag,
		index: index
	};

	return Constructor;
})();

exports.Reading = new Reading();