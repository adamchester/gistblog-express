/*jshint node: true */
"use strict";

var gists = require('./gists'),
	rl = require('./reading_list'),
	_ = require('underscore'),
	cache = require('./cache'),
	async = require('async'),
	util = require('util'),
	logging = require('./logging'),
	NotFound = require('./errors').NotFound
;

// TODO: rename/split/organise this module
// This module coordinates service calls then builds view models from the results

// Cache our important data in memory
var log = logging.forModule('shared');
var getArgs = { username: 'adamchester', allContents: true };
var blogPostsForUserCache = cache.cachify(gists.getBlogPostsForUser, { args: getArgs, expiryMinutes: 5.0 });
var tagsCache = cache.cachify(rl.getTags, { updateCacheOnCreation: true });


function ViewModel (title, pageTemplateName) {
	this.title = title;
	this.pageTemplateName = pageTemplateName;
	this.topLevelPage = topLevelPages.none;

	this.extend = function(extendedModel) {
		return _.extend(this, extendedModel);
	};

	return this;
}

function asyncify() {
	return async.apply.apply(null, arguments);
}

function activeIfEquals(name, testName) {
	return name === testName ? 'active' : '';
}

function TopLevelPage(id, name, href, title) {
	this.id = id;
	this.routePattern = href;
	this.pageTemplateName = id;
	this.name = name;
	this.href = href;
	this.title = title;
	return this;
}

TopLevelPage.prototype.activeIfEquals = function(topLevelPage) {
	return this === topLevelPage ? 'active' : '';
};

TopLevelPage.prototype.toTopLevelMenuItem = function(renderingTopLevelPage) {
	if (this === topLevelPages.none) {
		throw new Error('You cannot convert the [none] item to a menu item');
	}

	return {
		href: this.href,
		text: this.name,
		name: this.name,
		title: this.title,
		classes: this.activeIfEquals(renderingTopLevelPage)
	};
};

var topLevelPages = {
	none: new TopLevelPage('none', 'none', '', 'none'),
	index: new TopLevelPage('index', 'Posts', '/', 'Rarely updated'),
	about: new TopLevelPage('about', 'About', '/about', 'About rarely update'),
	reading: new TopLevelPage('reading', 'Reading', '/reading', 'Reading list'),
	twitter: new TopLevelPage('twitter', 'Twitter', '/twitter', 'Twitter - not quite as rarely updated'),
	github: new TopLevelPage('github', 'Github', 'http://github.com/adamchester/gistblog-express', 'Use the source, luke.')
};

module.exports.isTopLevelPage = function (topLevelPage) {
	return topLevelPage && topLevelPages[topLevelPage.id] !== null;
};

function getTopLevelMenuItems(renderingTopLevelPage) {
	return _.chain(topLevelPages)
		.filter(function (page) { return page !== topLevelPages.none; })
		.map(function (page) { return page.toTopLevelMenuItem(renderingTopLevelPage); })
		.value();
}

// Defines the 'shared' view model (used by the base page layout)
// all page view models should include the 'shared' model
function SharedLayoutViewModel(currentTopLevelPage, readingListTags, additional) {

	if (!currentTopLevelPage) throw new Error('top level page must be defined');

	// Inherit from ViewModel
	ViewModel.call(this, currentTopLevelPage.title, currentTopLevelPage.pageTemplateName);

	// SharedLayoutViewModel properties
	this.currentTopLevelPage = currentTopLevelPage;
	this.topLevelMenuItems = getTopLevelMenuItems(currentTopLevelPage);
	this.readingListTags = readingListTags;

	if (additional) {
		_.extend(this, additional);
	}

	return this;
}
util.inherits(SharedLayoutViewModel, ViewModel);


function getSharedLayoutViewModel(renderingTopLevelPage, callback) {

	tagsCache.get(function gotTags(err, tags) {
		if (err) return callback(err);
		callback(null, new SharedLayoutViewModel(renderingTopLevelPage, tags));
	});
}

//
// View model for GET / (index)
//

function buildIndexViewModel(posts) {
	var page = topLevelPages.index;

	return new ViewModel(page.title, page.pageTemplateName)
		.extend({
			posts: posts
		});
}

function getIndexViewModel(callback) {

	async.parallel({
			posts: asyncify(blogPostsForUserCache.get)
		},
		function gotIndexViewModelData(err, results) {
			if (err) return callback(err);

			var viewModel = buildIndexViewModel(results.posts);
			callback(err, viewModel);
		});
}


//
// View model for GET: /post/:id
//
function buildPostViewModel(postId, indexViewModel) {

	// find the post in the index view model
	var post = _.chain(indexViewModel.posts)
		.filter(function (post) { return post.id == postId; })
		.first()
		.value();

	var title = post ? post.title : 'Post';
	var pageTemplateName = 'post';

	return new ViewModel(title, pageTemplateName)
		.extend({
			post: post
		});
}

function getPostViewModel(postId, callback) {

	async.parallel({
			index: asyncify(getIndexViewModel),
			shared: asyncify(getSharedLayoutViewModel, topLevelPages.index)
		},
		function onGotAsyncData(err, results) {
			if (err) return callback(err);

			var viewModel = buildPostViewModel(postId, results.index, results.shared);

			if (!viewModel.post) {
				return callback(new NotFound("Unable to find post with id " + postId));
			}

			callback(err, viewModel);
		});
}

//
// View model for GET /about
//
function getAboutViewModel (callback) {
	var page = topLevelPages.about;
	callback(null, new ViewModel(page.title, page.pageTemplateName));
}

//
// View model for GET /reading
//
function buildReadingListViewModel(readingListItems) {
	var page = topLevelPages.reading;

	return new ViewModel(page.title, page.pageTemplateName)
		.extend({ items: readingListItems });
}

function getReadingListViewModel(callback) {

	async.parallel({
			readingListItems: rl.getReadingList
		},
		function onGotAsyncData(err, results) {
			if (err) return callback(err);
			var model = buildReadingListViewModel(results.readingListItems);
			callback(null, model);
		});
}

//
// View model for GET /reading/tags/:tagName
//

function buildReadingTagViewModel(tagName, tag, readingListItemsForTag) {

	var title = 'Reading list for tag [' + tagName + ']';
	var pageTemplateName = 'reading_tag';

	return new ViewModel(title, pageTemplateName)
		.extend({
			tag: tag,
			items: readingListItemsForTag
		});
}

function getReadingTagViewModel(tagName, callback) {
	async.parallel({
			readingListForTag: asyncify(rl.getReadingListForTag, tagName),
			tag: asyncify(rl.getTag, tagName)
		},
		function onGotAsyncData(err, results) {
			if (err) return callback(err);
			var model = buildReadingTagViewModel(tagName, results.tag, results.readingListForTag);
			if (!model.tag) return callback(new NotFound('The reading list tag ' + tagName + ' was not found'));
			callback(null, model);
		});
}

function buildTwitterViewModel() {
	var page = topLevelPages.twitter;
	return new ViewModel(page.title, page.pageTemplateName);
}

function getTwitterViewModel(callback) {
	var viewModel = buildTwitterViewModel();
	callback(null, viewModel);
}

module.exports.topLevelPages = topLevelPages;
module.exports.TopLevelPage = TopLevelPage;

module.exports.ViewModel = ViewModel;

module.exports.SharedLayoutViewModel = SharedLayoutViewModel;
module.exports.getSharedLayoutViewModel = getSharedLayoutViewModel;

module.exports.getIndexViewModel = getIndexViewModel;
module.exports.getPostViewModel = getPostViewModel;
module.exports.getTwitterViewModel = getTwitterViewModel;

module.exports.getAboutViewModel = getAboutViewModel;

module.exports.getReadingTagViewModel = getReadingTagViewModel;
module.exports.getReadingListViewModel = getReadingListViewModel;

