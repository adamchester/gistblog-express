
var gists = require('./gists'),
	rl = require('./reading_list'),
	_ = require('underscore'),
	cache = require('./cache'),
	async = require('async'),
	logging = require('./logging')
;

// see http://expressjs.com/guide.html#error-handling
function NotFoundError(msg){
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}
NotFoundError.prototype = new Error();
module.exports.NotFoundError = NotFoundError;

// TODO: rename/split/organise this module
// This module coordinates service calls then builds view models from the results

// Cache our important data
var log = logging.forModule('shared');
var getArgs = { username: 'adamchester', allContents: true };
var blogPostsForUserCache = cache.cachify(gists.getBlogPostsForUser, { args: getArgs, expiryMinutes: 5.0 });
var tagsCache = cache.cachify(rl.getTags, { updateCacheOnCreation: true });


function asyncify() {
	return async.apply.apply(null, arguments);
}

function activeIfEquals(name, testName) {
	return name === testName ? 'active' : '';
}

function TopLevelPage(id, name, href, title) {
	this.id = id;
	this.name = name;
	this.href = href;
	this.title = title;
	return this;
}

TopLevelPage.prototype.activeIfEquals = function(topLevelPage) {
	return this === topLevelPage ? 'active' : '';
};

TopLevelPage.prototype.toTopLevelMenuItem = function(renderingTopLevelPage) {
	return {
		href: this.href,
		text: this.name,
		name: this.name,
		title: this.title,
		classes: this.activeIfEquals(renderingTopLevelPage)
	};
};

var topLevelPages = {
	index: new TopLevelPage('index', 'Posts', '/', 'Rarely updated'),
	about: new TopLevelPage('about', 'About', '/about', 'About rarely update'),
	reading: new TopLevelPage('reading', 'Reading', '/reading', 'Reading list'),
	twitter: new TopLevelPage('twitter', 'Twitter', '/twitter', 'Twitter - not quite as rarely updated'),
	github: new TopLevelPage('github', 'Github', 'http://github.com/adamchester/gistblog-express', 'Use the source, luke.')
};

module.exports.topLevelPages = topLevelPages;

function getTopLevelMenuItems(renderingTopLevelPage) {
	return _.chain(topLevelPages)
		.map(function (page) { return page.toTopLevelMenuItem(renderingTopLevelPage); })
		.value();
}

// deal with the 'shared' view model (used by the base page layout)
// all page view models should include the 'shared' model
function SharedViewModel(currentTopLevelPage, readingListTags, additional) {

	if (!currentTopLevelPage) throw new Error('top level page must be defined');

	this.currentTopLevelPage = currentTopLevelPage;
	this.title = currentTopLevelPage.title;
	this.topLevelMenuItems = getTopLevelMenuItems(currentTopLevelPage);
	this.pageTemplateName = currentTopLevelPage.id;

	this.readingListTags = readingListTags;

	if (additional) {
		_.extend(this, additional);
	}

	this.extend = function(extendedModel) {
		return _.extend(this, extendedModel);
	};

	return this;
}

function getSharedViewModel(renderingTopLevelPage, callback) {
	tagsCache.get(function gotTags(err, tags) {
		if (err) return callback(err);
		callback(null, new SharedViewModel(renderingTopLevelPage, tags));
	});
}

//
// View model for GET / (index)
//

function buildIndexViewModel(posts, shared) {
	return shared.extend({posts: posts});
}

function getIndexViewModel(callback) {

	async.parallel({
			posts: asyncify(blogPostsForUserCache.get),
			shared: asyncify(getSharedViewModel, topLevelPages.index)
		},
		function gotIndexViewModelData(err, results) {
			if (err) return callback(err);

			var viewModel = buildIndexViewModel(results.posts, results.shared);
			callback(err, viewModel);
		});
}


//
// View model for GET: /post/:id
//
function buildPostViewModel(postId, indexViewModel, sharedViewModel) {

	// find the post in the index view model
	var post = _.chain(indexViewModel.posts)
		.filter(function (post) { return post.id == postId; })
		.first()
		.value();

	return sharedViewModel.extend({
		// override the title, post may not exist
		title: post ? post.title : sharedViewModel.currentTopLevelPage.title,
		post: post,
		pageTemplateName: 'post'
	});
}

function getPostViewModel(postId, callback) {

	async.parallel({
			index: asyncify(getIndexViewModel),
			shared: asyncify(getSharedViewModel, topLevelPages.index)
		},
		function onGotAsyncData(err, results) {
			if (err) return callback(err);

			var viewModel = buildPostViewModel(postId, results.index, results.shared);

			if (!viewModel.post) {
				return callback(new NotFoundError("Unable to find post with id " + postId));
			}

			callback(err, viewModel);
		});
}

function buildAboutViewModel (shared) {
	return shared.extend({});
}

//
// View model for GET /about
//
function getAboutViewModel (callback) {

	getSharedViewModel (topLevelPages.about, function onGotSharedViewModel (err, shared) {
		if (err) return callback(err);

		var model = buildAboutViewModel(shared);
		callback(null, model);
	});
}

//
// View model for GET /reading
//

function buildReadingListViewModel(readingListItems, sharedViewModel) {
	return sharedViewModel.extend({ items: readingListItems });
}

function getReadingListViewModel(callback) {

	async.parallel({
			readingListItems: rl.getReadingList,
			shared: asyncify(getSharedViewModel, topLevelPages.reading)
		},
		function onGotAsyncData(err, results) {
			if (err) return callback(err);

			var model = buildReadingListViewModel(
				results.readingListItems,
				results.shared);

			callback(null, model);
		});
}

//
// View model for GET /reading/tags/:tagName
//

function buildReadingTagViewModel(tagName, readingListItemsForTag, sharedViewModel) {

	var tag = _.chain(sharedViewModel.readingListTags)
		.find(function (tag) { return tag.name === tagName; })
		.value();

	return sharedViewModel.extend({
		title: 'Reading list for tag [' + tagName + ']',
		tag: tag,
		items: readingListItemsForTag
	});
}

function getReadingTagViewModel(tagName, callback) {

	async.parallel({
			readingListForTag: asyncify(rl.getReadingListForTag, tagName),
			shared: asyncify(getSharedViewModel, topLevelPages.reading)
		},
		function onGotAsyncData(err, results) {
			if (err) return callback(err);

			var model = buildReadingTagViewModel(
				tagName,
				results.readingListForTag,
				results.shared);

			if (!model.tag) return callback(new NotFoundError('The reading list tag ' + tagName + ' was not found'));

			callback(null, model);
		});
}

function buildTwitterViewModel(sharedViewModel) {
	return sharedViewModel;
}

function getTwitterViewModel(callback) {
	getSharedViewModel(topLevelPages.twitter, function onGotSharedViewModel(err, shared) {
		if (err) return callback(err);

		var viewModel = buildTwitterViewModel(shared);
		callback(null, viewModel);
	});
}

module.exports.getAboutViewModel = getAboutViewModel;
module.exports.getTwitterViewModel = getTwitterViewModel;
module.exports.getReadingTagViewModel = getReadingTagViewModel;
module.exports.getIndexViewModel = getIndexViewModel;
module.exports.getSharedViewModel = getSharedViewModel;
module.exports.getPostViewModel = getPostViewModel;
module.exports.getReadingListViewModel = getReadingListViewModel;

