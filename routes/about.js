
var s = require('../lib/shared');

var About = (function About() {


	function Constructor() {
	}

	/*
	* GET /about page.
	*/
	function index(req, res) {

		s.getSharedViewModel('about', function gotSharedViewModel(err, sharedModel) {
			res.render('about', {
				shared: sharedModel,
				title: 'About rarely updated'
			});
		});
	}

	Constructor.prototype = {
		index: index
	};

	return Constructor;
})();

exports.About = new About();
