
var s = require('../lib/shared');

var About = (function About() {


	function Constructor() {
	}

	/*
	* GET /about page.
	*/
	function index(req, res) {
		var thisPage = s.topLevelPages.about;
		s.getSharedViewModel(thisPage, function gotSharedViewModel(err, sharedModel) {
			res.render(thisPage.id, { shared: sharedModel, title: thisPage.title });
		});
	}

	Constructor.prototype = {
		index: index
	};

	return Constructor;
})();

exports.About = new About();
