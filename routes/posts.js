
/*
 * GET home page.
 */

var shared = require('../lib/shared')
;

var Posts = function() {

	this.index = function(req, res) {
		shared.getIndexViewModel(function(error, viewModel) {
			if (error) throw error;
			res.render(viewModel.pageTemplateName, viewModel);
		});
	};

	this.post = function(req, res) {
		var postId = req.params.id;
		shared.getPostViewModel(postId, function(error, viewModel) {
			if (error) throw error;
			res.render(viewModel.pageTemplateName, viewModel);
		});
	};

	this.twitter = function(req, res) {
		shared.getTwitterViewModel(function gotSharedViewModel(error, viewModel) {
			res.render(viewModel.pageTemplateName, viewModel);
		});
	};
};

exports.Posts = new Posts();
