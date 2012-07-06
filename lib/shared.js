
var gists = require('./gists')
	, rl = require('./reading_list')
	, _ = require('underscore')
	, cache = require('./cache')
;

var getBlogPostsForUserOptions = { 
	username:'adamchester',
	allContents: true,
};

var getBlogPostsForUserCached = new cache.AsyncMethod({
	method: gists.getBlogPostsForUser,
	args: getBlogPostsForUserOptions,
});

var getSidebarLinks = function(forSectionName) {
	return [
		{ href:'/', text: 'Home'}
		,{ href:'/about', text: 'About'}
		,{ href:'/reading', text: 'Reading'}
		,{ href:'/twitter', text: 'Twitter'}
	];
}

function activeIfEquals(name, testName) { 
	if(name === testName) return 'active'; return '';
}

var getNavClasses = function(forSectionName) {
	return {
		home: activeIfEquals('home', forSectionName),
		about: activeIfEquals('about', forSectionName),
		twitter: activeIfEquals('twitter', forSectionName),
		reading: activeIfEquals('reading', forSectionName),
	};
}

var getSharedViewModel = function(forSectionName) {
	return {
		navClasses: getNavClasses(forSectionName),
		sidebarLinks: getSidebarLinks(forSectionName),
	};
}

function getIndexViewModel(callback) {
	
	getBlogPostsForUserCached.execute({}, function(posts, error) {
		if (error) {
			callback(null, error);
		} else {
			var viewModel = { 
				posts: posts,
				shared: getSharedViewModel('home'),
				title: 'Rarely updated' 
			};

			callback(viewModel);
		}
	});
}

function getPostViewModel(postId, callback) {

	getIndexViewModel(function(indexViewModel) {

		// find the post in the index view model cache
		var post = _.chain(indexViewModel.posts)
			.filter(function(post) { return post.id == postId})
			.first()
			.value();

		var postViewModel = { title: post.title, post: post, shared: getSharedViewModel('post') };
		callback(postViewModel);
	});
}

function getReadingListViewModel(callback) {
	rl.getReadingList( function getReadingListCallback(readingListItems) {
		callback({ 
			title: 'Reading list'
			, items: readingListItems
			, shared: getSharedViewModel('reading') 
		});
	});
}

module.exports.getIndexViewModel = getIndexViewModel;
module.exports.getSharedViewModel = getSharedViewModel;
module.exports.getPostViewModel = getPostViewModel;
module.exports.getReadingListViewModel = getReadingListViewModel;

