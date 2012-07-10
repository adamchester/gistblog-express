var s = require('../lib/shared');

var Reading = (function Reading() {

	function Constructor() {}

	function index(req, res) {
		s.getReadingListViewModel(function(error, model) {
			if (error) throw error;
			res.render('reading', model);
		});
	}

	function tag(req, res) {

		var tagName = req.params.tagName;
		s.getReadingTagViewModel(tagName, function gotTagViewModel(error, model) {
			if (error) throw error;
			res.render('reading_tag', model);
		});
	}

	Constructor.prototype = {
		tag: tag,
		index: index
	};

	return Constructor;
})();

exports.Reading = new Reading();