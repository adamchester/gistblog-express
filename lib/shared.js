/*jshint node: true */
var Shared = exports;

(function() {
  'use strict';

  var gists = require('./gists'),
    rl = require('./reading_list'),
    _ = require('underscore'),
    cache = require('./cache'),
    async = require('async'),
    util = require('util'),
    logging = require('./logging'),
    tagc = require('./tag-cloud'),
    NotFound = require('./errors').NotFound;

  // TODO: rename/split/organise this module
  // This module coordinates service calls then builds view models
  // from the results

  // Cache our important data in memory
  var log = logging.forModule('shared');
  var getArgs = { username: 'adamchester', allContents: true };
  var blogPostsForUserCache = cache.cachify(gists.getBlogPostsForUser, {
    args: getArgs, expiryMinutes: 5.0 });

  var tagsCache = cache.cachify(rl.getTags, { updateCacheOnCreation: true });

  /**
  * Grouping/Sorting/Filtering functions
  * @type {Object}
  */
  var c = {
    self: function(it) { return it; },
    pageIsNot: function(notPage) { return function(page) { return page !== notPage; }; },
    byDate: function(item) { return item.date; },
    containsTag: function(tagName) { return function(item) { return _(item.tags).contains(tagName); }; },
    postIdEquals: function(postId) { return function(post) { return post.id.toString() === postId.toString(); }; },
    toTopLevelMenuItemForCurrentPage: function(renderingTopLevelPage) {
      return function(page) { return page.toTopLevelMenuItem(renderingTopLevelPage); }; }
  };

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

  TopLevelPage.prototype.activeIfEquals = function activeIfEquals(topLevelPage) {
    return this === topLevelPage ? 'active' : '';
  };

  var topLevelPages = {
    none: new TopLevelPage('none', 'none', '', 'none'),
    index: new TopLevelPage('index', 'Posts', '/', 'Rarely updated blog'),
    about: new TopLevelPage('about', 'About', '/about', 'About the Rarely Updated blog'),
    reading: new TopLevelPage('reading', 'Reading', '/reading', 'Reading list'),
    twitter: new TopLevelPage('twitter', 'Twitter', '/twitter', 'Twitter - not quite as rarely updated'),
    github: new TopLevelPage('github', 'Github', 'http://github.com/adamchester/gistblog-express', 'Use the source, luke.')
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

  Shared.isTopLevelPage = function(topLevelPage) {
    return topLevelPage && topLevelPages[topLevelPage.id] !== null;
  };

  function ViewModel(title, pageTemplateName) {
    this.title = title;
    this.pageTemplateName = pageTemplateName;
    this.topLevelPage = topLevelPages.none;

    this.extend = function(extendedModel) {
      return _.extend(this, extendedModel);
    };

    return this;
  }

  function getTopLevelMenuItems(renderingTopLevelPage) {
    return _.chain(topLevelPages)
      .filter(c.pageIsNot(topLevelPages.none))
      .map(c.toTopLevelMenuItemForCurrentPage(renderingTopLevelPage))
      .value();
  }

  function extractPostTags(blogPostsForUser) {
    return tagc.extractTags(blogPostsForUser, {tagUrlPrefix: '/posts/tag/'});
  }

  function filterToRecentPostItems(blogPostsForUser) {
    return _.chain(blogPostsForUser)
      .sortBy(c.byDate)
      .reverse()
      .toArray()
      .first(3)
      .value();
  }

  // Defines the 'shared' view model (used by the base page layout)
  // all page view models should include the 'shared' model
  function SharedLayoutViewModel(currentTopLevelPage, readingListTags, blogPostsForUser, additional) {

    if (!currentTopLevelPage) { throw new Error('top level page must be defined'); }
    if (!readingListTags) { throw new Error('readingListTags must be provided'); }
    if (!blogPostsForUser) { throw new Error('blogPostsForUser must be provided'); }

    // Inherit from ViewModel
    ViewModel.call(this, currentTopLevelPage.title, currentTopLevelPage.pageTemplateName);

    // SharedLayoutViewModel properties
    this.currentTopLevelPage = currentTopLevelPage;
    this.topLevelMenuItems = getTopLevelMenuItems(currentTopLevelPage);
    this.readingListTags = readingListTags;
    this.recentPosts = filterToRecentPostItems(blogPostsForUser);
    this.postTags = extractPostTags(blogPostsForUser);

    if (additional) {
      _.extend(this, additional);
    }

    return this;
  }
  util.inherits(SharedLayoutViewModel, ViewModel);


  function getSharedLayoutViewModel(renderingTopLevelPage, callback) {

    async.parallel({
      posts: asyncify(blogPostsForUserCache.get),
      tags: asyncify(tagsCache.get)
    },
    function gotSharedLayoutViewModel(err, results) {
      if (err) { return callback(err); }
      callback(null, new SharedLayoutViewModel(renderingTopLevelPage, results.tags, results.posts));
    });
  }

  //
  // View model for GET / (index)
  //

  function buildIndexViewModel(posts) {
    var page = topLevelPages.index;

    var sortedPosts = _.chain(posts).sortBy(c.byDate).reverse().value();

    return new ViewModel(page.title, page.pageTemplateName)
      .extend({
        posts: sortedPosts
      });
  }

  function getIndexViewModel(callback) {

    async.parallel({
        posts: asyncify(blogPostsForUserCache.get)
      },
      function gotIndexViewModelData(err, results) {
        if (err) { return callback(err); }

        var viewModel = buildIndexViewModel(results.posts);
        callback(err, viewModel);
      });
  }

  function buildPostsForTagViewModel(tagName, blogPostsForUser) {

    var postsForTag = _.chain(blogPostsForUser)
      .filter(c.containsTag(tagName))
      .sortBy(c.byDate)
      .reverse()
      .value();

    var title = 'Posts for tag ' + tagName;
    var pageTemplateName = 'posts_for_tag';

    return new ViewModel(title, pageTemplateName)
      .extend({
        posts: postsForTag
      });
  }

  function getPostsForTagViewModel(tagName, callback) {

    async.parallel({
        posts: asyncify(blogPostsForUserCache.get)
      },
      function gotIndexViewModelData(err, results) {
        if (err) { return callback(err); }

        var viewModel = buildPostsForTagViewModel(tagName, results.posts);
        callback(err, viewModel);
      });
  }

  //
  // View model for GET: /post/:id
  //
  function buildPostViewModel(postId, indexViewModel) {

    // find the post in the index view model
    var post = _.chain(indexViewModel.posts)
      .filter(c.postIdEquals(postId))
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
        if (err) { return callback(err); }

        var viewModel = buildPostViewModel(postId, results.index, results.shared);

        if (!viewModel.post) {
          return callback(new NotFound('Unable to find post with id ' + postId));
        }

        callback(err, viewModel);
      });
  }

  //
  // View model for GET /about
  //
  function getAboutViewModel(callback) {
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
        if (err) { return callback(err); }
        var model = buildReadingListViewModel(results.readingListItems);
        callback(null, model);
      });
  }

  //
  // View model for GET /reading/tags/:tagName
  //

  function buildReadingTagViewModel(tagName, tag, readingListItemsForTag) {

    var title = tagName + ' - reading list items';
    var pageTemplateName = 'reading_tag';

    var viewModel = new ViewModel(title, pageTemplateName)
      .extend({
        tag: tag,
        items: readingListItemsForTag
      });

    return viewModel;
  }

  function getReadingTagViewModel(tagName, callback) {

    async.parallel({
        readingListForTag: asyncify(rl.getReadingListForTag, tagName),
        tag: asyncify(rl.getTag, tagName)
      },
      function onGotAsyncData(err, results) {
        if (err) { return callback(err); }
        var model = buildReadingTagViewModel(tagName, results.tag, results.readingListForTag);
        if (!model.tag) {
          return callback(new NotFound('The reading list tag ' + tagName + ' was not found'));
        }
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

  Shared.topLevelPages = topLevelPages;
  Shared.TopLevelPage = TopLevelPage;
  Shared.ViewModel = ViewModel;
  Shared.SharedLayoutViewModel = SharedLayoutViewModel;
  Shared.getSharedLayoutViewModel = getSharedLayoutViewModel;
  Shared.getIndexViewModel = getIndexViewModel;
  Shared.getPostViewModel = getPostViewModel;
  Shared.getPostsForTagViewModel = getPostsForTagViewModel;
  Shared.getTwitterViewModel = getTwitterViewModel;
  Shared.getAboutViewModel = getAboutViewModel;
  Shared.getReadingTagViewModel = getReadingTagViewModel;
  Shared.getReadingListViewModel = getReadingListViewModel;
}());
