
var s = require('../lib/shared');

var About = (function About() {


	function Constructor() {
	}

	/*
	 * GET /about page.
	 */
	function index(req, res) {
		res.render('about', { 
			shared: s.getSharedViewModel('about'),
			title: 'About rarely updated' 
		});
	};

	Constructor.prototype = {
		index: index
		,
	};

	return Constructor;
})();

exports.About = new About();
