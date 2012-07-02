
/*
 * GET home page.
 */

var gists = require('../lib/gists.js');

// TODO: come up with a better way of caching/refreshing?
var viewModelCache = { 
	posts: [],
	homeNavClasses: 'active',
	aboutNavClasses: '',
	title: 'Rarely updated' 
};

var lastGet = new Date(2000, 1, 1);

function checkUpdateCache() {
	// todo: this is crap, do it better
	var age = (new Date() - lastGet) / 60000;
	if (age > 5) {
		console.log('getting latest data from github');

		gists.getAllBlogPostsContent('adamchester', function(posts) {
			lastGet = new Date();
			viewModelCache.posts = posts;
		});
	}
}

var Posts = function() {

	this.index = function(req, res) {
		checkUpdateCache();
		res.render('index', viewModelCache);
	};

	this.post = function(req, res) {

		checkUpdateCache();
		console.log('loading post id %s', req.params.id);

		// find the post in the view model cache
		// todo: this is crap, do it better (underscore?)
		for (var i = viewModelCache.posts.length - 1; i >= 0; i--) {
			var thisPost = viewModelCache.posts[i];
			if (thisPost.id == req.params.id) {
				res.render('post', { title: thisPost.title, post: thisPost, homeNavClasses: '', aboutNavClasses: '' });
			}
		};

	};
};

exports.Posts = new Posts;
