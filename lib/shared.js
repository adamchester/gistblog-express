
var gists = require('./gists')
	, _ = require('underscore')
	// , 
;

var lastGet = new Date(2000, 1, 1);
var isRefreshingIndexViewModel = false;
var gistGetOptions = { username:'adamchester', allContents: true };

var getSidebarLinks = function() {
	return [
		{ href:'/', text: 'Home'}
		,{ href:'/about', text: 'About'}
		,{ href:'/twitter', text: 'Twitter'}
	];
}

var getNavClasses = function() {
	return {
		homeNavClasses: 'active',
		aboutNavClasses: '',
		twitterNavClasses: '',
	};
}

var getSharedViewModel = function() {
	return {
		navClasses: getNavClasses(),
		sidebarLinks: getSidebarLinks(),
	};
}

// TODO: come up with a better way of caching/refreshing?
var _indexViewModelCache = { 
	posts: [],
	shared: getSharedViewModel(),
	title: 'Rarely updated' 
};

function refreshIndexViewModel(callback) {

	console.log('getting latest data from github: %s', JSON.stringify(gistGetOptions));
	isRefreshingIndexViewModel = true;

	gists.getBlogPostsForUser(gistGetOptions, function(posts) {
		lastGet = new Date();
		_indexViewModelCache.posts = posts;
		isRefreshingIndexViewModel = false;
		callback(_indexViewModelCache);
	});
}

function getIndexViewModel(callback) {
	
	var age = (new Date() - lastGet) / 60000;
	var hasOldCache = _indexViewModelCache.posts.length > 0;
	var isRefreshing = isRefreshingIndexViewModel;
	var needsRefresh = age > 1;

	if (!hasOldCache) {
		// block the caller while waiting for the data
		console.log('refreshing the index view model for the first time');
		refreshIndexViewModel(callback);
	} else {
		if (needsRefresh && !isRefreshing) {
			// refresh without blocking
			console.log('refreshing the index view model, async')
			refreshIndexViewModel(function() {});
		}
		else if (needsRefresh && isRefreshing) {
			console.log('needs a refresh, but alreadying waiting for a refresh');
		}

		// return the last cached copy
		console.log('returning cached index view model, age = %s', age);
		callback(_indexViewModelCache);
	}
}

function getPostViewModel(req, callback) {
	var request = req;
	getIndexViewModel(function(indexViewModel) {
		// find the post in the index view model cache
		var post = _.chain(indexViewModel.posts)
			.filter(function(post) { return post.id === request.params.id})
			.first()
			.value();

		callback(post);
	});
}

function getReadingListViewModel(req, callback) {
	var request = req;
	callback({ shared: getSharedViewModel() });
}

module.exports.getIndexViewModel = getIndexViewModel;
module.exports.getSharedViewModel = getSharedViewModel;
module.exports.getPostViewModel = getPostViewModel;
module.exports.getReadingListViewModel = getReadingListViewModel;

