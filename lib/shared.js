
var gists = require('./gists')
	, _ = require('underscore')
	// , 
;

var lastGet = new Date(2000, 1, 1);
var isRefreshingIndexViewModel = false;
var gistGetOptions = { username:'adamchester', allContents: true };

var getSidebarLinks = function(forSectionName) {
	return [
		{ href:'/', text: 'Home'}
		,{ href:'/about', text: 'About'}
		,{ href:'/reading', text: 'Reading'}
		,{ href:'/twitter', text: 'Twitter'}
	];
}

function activeIfEquals(name, testName) { if(name === testName) return 'active'; return ''; }

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

// TODO: come up with a better way of caching/refreshing?
var _indexViewModelCache = { 
	posts: [],
	shared: getSharedViewModel('home'),
	title: 'Rarely updated' 
};

function refreshIndexViewModel(callback) {

	console.log('getting latest data from github: %s', JSON.stringify(gistGetOptions));
	isRefreshingIndexViewModel = true;

	gists.getBlogPostsForUser(gistGetOptions, function(posts) {
		lastGet = new Date();
		_indexViewModelCache.posts = posts;
		isRefreshingIndexViewModel = false;
		// console.log('got index view model %s', JSON.stringify(_indexViewModelCache))
		callback(_indexViewModelCache);
	});
}

function getIndexViewModel(callback) {
	
	var age = (new Date() - lastGet) / 60000;
	var hasOldCache = _indexViewModelCache.posts.length > 0;
	var isRefreshing = isRefreshingIndexViewModel;
	var needsRefresh = age > 5;

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

function readingListTimeAdded(readingListItem) {
	return readingListItem.time_added;
}

function toReadingListItem(pocketApiListItem) {
	return { 
		id: Number(pocketApiListItem.item_id)
		, title: (pocketApiListItem.title ? pocketApiListItem.title : '[no title]')
		, url: pocketApiListItem.url
		, time_added: new Date(pocketApiListItem.time_added * 1000) // see http://www.epochconverter.com/programming/#javascript
		, time_updated: new Date(pocketApiListItem.time_updated * 1000)
		, tags: (pocketApiListItem.tags === undefined ? [] : pocketApiListItem.tags.split(','))
		, isRead: (pocketApiListItem.state == 1)
	}
}

function getReadingListViewModel(callback) {
	// TODO: connect to getpocket API instead
	var readingListJson = require('../test/assets/reading_list.json');
	var readingListItems = _
		.chain(readingListJson)
		.map(toReadingListItem)
		.sortBy(readingListTimeAdded)
		.reverse()
		.value();
	callback({ title: 'Reading list', items: readingListItems, shared: getSharedViewModel('reading') });
}

module.exports.getIndexViewModel = getIndexViewModel;
module.exports.getSharedViewModel = getSharedViewModel;
module.exports.getPostViewModel = getPostViewModel;
module.exports.getReadingListViewModel = getReadingListViewModel;

