
/*
 * GET home page.
 */

var gists = require('../lib/gists')
	, _ = require('underscore')
	, shared = require('../lib/shared')
;

var Posts = function() {

	this.index = function(req, res) {
		shared.getIndexViewModel(function(viewModel) {
			res.render('index', viewModel);
		});
	};

	this.post = function(req, res) {
		shared.getPostViewModel(req, function(post) {
			res.render('post', { title: post.title, post: post, shared: shared.getSharedViewModel() });
		});
	};

	this.twitter = function(req, res) {
		res.render('twitter', { title: 'Twitter', shared: shared.getSharedViewModel() });
	};
};

exports.Posts = new Posts;
