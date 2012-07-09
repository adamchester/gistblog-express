
/*
 * GET home page.
 */

var shared = require('../lib/shared')
;

var Posts = function() {

	this.index = function(req, res) {
		shared.getIndexViewModel(function(error, viewModel) {
			if (error) throw error;
			res.render('index', viewModel);
		});
	};

	this.post = function(req, res) {
		var postId = req.params.id;
		shared.getPostViewModel(postId, function(error, viewModel) {
			if (error) throw error;
			res.render('post', viewModel);
		});
	};

	this.twitter = function(req, res) {
		shared.getSharedViewModel('twitter', function gotSharedViewModel(error, model) {
			res.render('twitter', { title: 'Twitter', shared: model });
		});
	};
};

exports.Posts = new Posts();
