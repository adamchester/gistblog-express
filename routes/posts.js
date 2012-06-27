
/*
 * GET home page.
 */

var request = require('request')
	, gists = require('../lib/gists.js');


var Posts = function() {

	this.index = function(req, res) {
		gists.getGists('adamchester', function(gists) {
			res.render('index', { 
				gists: gists.gists,
				homeNavClasses: 'active',
				aboutNavClasses: '',
				title: 'Rarely updated' 
			});
		});
	};

	this.gist = function(req, res) {
		res.render('gist', { title: 'test', content: 'text' })
	};
};

exports.Posts = new Posts;
