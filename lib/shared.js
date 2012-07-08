
var gists = require('./gists'),
	rl = require('./reading_list'),
	_ = require('underscore'),
	cache = require('./cache');


var getArgs = { username: 'adamchester', allContents: true };
var getBlogPostsForUserCached = cache.wrap(gists.getBlogPostsForUser, { args: getArgs, expiryMinutes: 5.0 });

function activeIfEquals(name, testName) {
	return name === testName ? 'active' : '';
}

function getSidebarLinks(forSectionName) {
	return [{ href: '/', text: 'Home', active: activeIfEquals('Home', forSectionName)},
		{ href: '/about', text: 'About', active: activeIfEquals('About', forSectionName)},
		{ href: '/reading', text: 'Reading', active: activeIfEquals('Reading', forSectionName)},
		{ href: '/twitter', text: 'Twitter', active: activeIfEquals('Twitter', forSectionName)}];
}

function getNavClasses(forSectionName) {
	return {
		home: activeIfEquals('home', forSectionName),
		about: activeIfEquals('about', forSectionName),
		twitter: activeIfEquals('twitter', forSectionName),
		reading: activeIfEquals('reading', forSectionName)
	};
}

function getSharedViewModel(forSectionName) {
	return {
		navClasses: getNavClasses(forSectionName),
		sidebarLinks: getSidebarLinks(forSectionName)
	};
}

function getIndexViewModel(callback) {

	getBlogPostsForUserCached(function gotBlogPosts(error, posts) {
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

	getIndexViewModel(function (error, model) {

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

	rl.getReadingList(function getReadingListCallback(error, readingListItems) {

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

