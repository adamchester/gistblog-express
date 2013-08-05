/*jshint node: true */
"use strict";

module.exports = function(app) {

	var s = require('../lib/shared');
	var l = require('../middleware/layout');

	/** GET /[index]
	*/
	app.get('/', l.forTopLevelPage(l.topLevelPages.index), function index (req, res) {
		s.getIndexViewModel(function (error, viewModel) {
			if (error) { throw error; }
			res.render(viewModel.pageTemplateName, viewModel);
		});
	});

	/** GET /posts/tag/:tagName
	*/
	app.get('/posts/tag/:tagName', l.withSharedLayout(), function postsForTag(req, res) {
		var tagName = req.params.tagName;
		s.getPostsForTagViewModel(tagName, function(error, viewModel) {
			if (error) { throw error; }
			res.render(viewModel.pageTemplateName, viewModel);
		});
	});

	/** GET /posts/:id
	*/
	app.get('/posts/:id', l.withSharedLayout(), function post (req, res) {
		var postId = req.params.id;
		s.getPostViewModel(postId, function (error, viewModel) {
			if (error) { throw error; }
			res.render(viewModel.pageTemplateName, viewModel);
		});
	});

	/** GET /twitter
	*/
	app.get('/twitter', l.forTopLevelPage(l.topLevelPages.twitter), function twitter (req, res) {
		s.getTwitterViewModel(function (error, viewModel) {
			res.render(viewModel.pageTemplateName, viewModel);
		});
	});

};
