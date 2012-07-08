
var gists = require('./gists'),
	rl = require('./reading_list'),
	_ = require('underscore'),
	cache = require('./cache');


var getArgs = { username: 'adamchester', allContents: true };
var blogPostsForUserCache = cache.cachify(gists.getBlogPostsForUser, { args: getArgs, expiryMinutes: 5.0 });

function activeIfEquals(name, testName) {
	return name === testName ? 'active' : '';
}

function getTopLevelMenuItems(forSectionName) {
	return [{ href: '/', text: 'Home', classes: activeIfEquals('home', forSectionName)},
		{ href: '/about', text: 'About', classes: activeIfEquals('about', forSectionName)},
		{ href: '/reading', text: 'Reading', classes: activeIfEquals('reading', forSectionName)},
		{ href: '/twitter', text: 'Twitter', classes: activeIfEquals('twitter', forSectionName)},
		{ href: 'http://github.com/adamchester/gistblog-express', text: 'Github', classes: ''}];
}

function getSharedViewModel(forSectionName) {
	return {
		topLevelMenuItems: getTopLevelMenuItems(forSectionName)
	};
}

function getIndexViewModel(callback) {

	blogPostsForUserCache.get(function gotBlogPosts(error, posts) {
		if (error) {
			callback(error);
		} else {
			var viewModel = {
				posts: posts,
				shared: getSharedViewModel('home'),
				title: 'Rarely updated'
			};

			callback(null, viewModel);
		}
	});
}

function getPostViewModel(postId, callback) {

	getIndexViewModel(function gotIndexViewModel(error, model) {

		if (error) {
			callback(error);
		}
		else {
			// find the post in the index view model cache
			var post = _.chain(model.posts)
				.filter(function (post) { return post.id == postId; })
				.first()
				.value();

			if (!post) throw new Error("unable to find post with id " + postId);

			callback(null, {
				title: post.title,
				post: post,
				shared: getSharedViewModel('post')
			});
		}
	});
}

function getReadingListViewModel(callback) {

	rl.getReadingList(function gotReadingList(error, readingListItems) {

		if (error) {
			callback(error);
		}
		else {
			callback(null, {
				title: 'Reading list',
				items: readingListItems,
				shared: getSharedViewModel('reading')
			});
		}
	});
}

module.exports.getIndexViewModel = getIndexViewModel;
module.exports.getSharedViewModel = getSharedViewModel;
module.exports.getPostViewModel = getPostViewModel;
module.exports.getReadingListViewModel = getReadingListViewModel;

