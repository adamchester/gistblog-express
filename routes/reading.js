
var s = require('../lib/shared');

var Reading = (function Reading() {

	function Constructor() {
	}

	/*
	 * GET /reading page.
	 */
	function index(req, res) {
		s.getReadingListViewModel(function (model) {
			res.render('reading', model);
		});
	};

	Constructor.prototype = {
		index: index
		,
	};

	return Constructor;
})();

exports.Reading = new Reading();
