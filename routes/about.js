
var request = require('request');


var About = function() {

	/*
	 * GET /about page.
	 */
	this.index = function(req, res) {
		res.render('about', { 
		homeNavClasses: '',
		aboutNavClasses: 'active',
		twitterNavClasses: '',
		title: 'About rarely updated' });
	};

};

exports.About = new About();
