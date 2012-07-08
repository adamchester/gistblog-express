var s = require('../lib/shared');

var Reading = (function Reading() {

	function Constructor() {}

	function index(req, res) {
		s.getReadingListViewModel(function(error, model) {
			if (error) throw error;
			res.render('reading', model);
		});
	}

	Constructor.prototype = {
		index: index
	};

	return Constructor;
})();

exports.Reading = new Reading();