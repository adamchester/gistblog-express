
var s = require('../lib/shared');

var Reading = (function Reading() {

	function Constructor() {
	}

	/*
	 * GET /reading page.
	 */
	function index(req, res) {
		res.render('reading', { 
			shared: s.getSharedViewModel(),
			title: 'Reading list' 
		});
	};

	Constructor.prototype = {
		index: index
		,
	};

	return Constructor;
})();

exports.Reading = new Reading();
