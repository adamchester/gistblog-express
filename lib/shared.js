
var gists = require('./gists'),
	rl = require('./reading_list'),
	_ = require('underscore'),
	cache = require('./cache');

// Cache our important data
var getArgs = { username: 'adamchester', allContents: true };
var blogPostsForUserCache = cache.cachify(gists.getBlogPostsForUser, { args: getArgs, expiryMinutes: 5.0 });
var tagsCache = cache.cachify(rl.getTags, { updateCacheOnCreation: true });

function activeIfEquals(name, testName) {
	return name === testName ? 'active' : '';
}

function getTopLevelMenuItems(forSectionName) {
	return [{ href: '/', text: 'Home', classes: activeIfEquals('index', forSectionName)},
		{ href: '/about', text: 'About', classes: activeIfEquals('about', forSectionName)},
		{ href: '/reading', text: 'Reading', classes: activeIfEquals('reading', forSectionName)},
		{ href: '/twitter', text: 'Twitter', classes: activeIfEquals('twitter', forSectionName)},
		{ href: 'http://github.com/adamchester/gistblog-express', text: 'Github', classes: ''}];
}

function getSharedViewModel(forSectionName, callback) {

	if (arguments.length !== 2) throw new Error('expected 2 arguments, forSectionName and callback');

	tagsCache.get(function gotTags(error, tags) {
		if (error) return callback(error);

		callback(null, {
			topLevelMenuItems: getTopLevelMenuItems(forSectionName),
			readingListTags: tags
		});
	});
}

function getIndexViewModel(callback) {

	blogPostsForUserCache.get(function gotBlogPosts(error, posts) {
		if (error) return callback(error);

		getSharedViewModel('index', function gotSharedViewMode(getSharedError, shared) {
			if (getSharedError) return callback(getSharedError);

			var viewModel = {
				posts: posts,
				shared: shared,
				title: 'Rarely updated'
			};

			callback(null, viewModel);
		});
	});
}

function getPostViewModel(postId, callback) {

	getIndexViewModel(function gotIndexViewModel(getIndexError, model) {
		if (getIndexError) return callback(getIndexError);

		getSharedViewModel('post', function gotSharedViewModel(getSharedError, shared) {
			if (getSharedError) return callback(getSharedError);

			// find the post in the index view model cache
			var post = _.chain(model.posts)
				.filter(function (post) { return post.id == postId; })
				.first()
				.value();

			if (!post) throw new Error("unable to find post with id " + postId);

			callback(null, {
				title: post.title,
				post: post,
				shared: shared
			});
		});
	});
}

function getReadingListViewModel(callback) {

	rl.getReadingList(function gotReadingList(getRlError, readingListItems) {
		if (getRlError) return callback(getRlError);

		getSharedViewModel('reading', function gotSharedViewModel(getSharedError, shared) {
			if (getSharedError) return callback(getSharedError);

			callback(null, {
				title: 'Reading list',
				items: readingListItems,
				shared: shared
			});
		});
	});
}

function getReadingTagViewModel(tagName, callback) {

	rl.getReadingListForTag(tagName, function gotReadingListForTag(error, readingListItems) {
		if (error) return callback(error);

		getSharedViewModel('reading', function gotSharedViewModel(getSharedError, shared) {
			if (getSharedError) return callback(getSharedError);

			var tag = _.chain(shared.readingListTags)
				.find(function (tag) { return tag.name === tagName; })
				.value();

			if (!tag) return callback(new Error('the tag ' + tagName + ' was not found'));

			callback(null, {
				title: 'Reading list tag: ' + tagName,
				tag: tag,
				items: readingListItems,
				shared: shared
		});
	});

	});
}

module.exports.getReadingTagViewModel = getReadingTagViewModel;
module.exports.getIndexViewModel = getIndexViewModel;
module.exports.getSharedViewModel = getSharedViewModel;
module.exports.getPostViewModel = getPostViewModel;
module.exports.getReadingListViewModel = getReadingListViewModel;

