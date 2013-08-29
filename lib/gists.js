"use strict";

var request = require("request"),
	_ = require("underscore"),
	async = require('async'),
	logging = require('./logging'),
	gconv = require('./gist-converter')
;

// this 'class' deals with getting data from github in a consistent way
var Gists = (function() {

	var apiRootUrl = 'https://api.github.com/',
		apiGistsFolder = 'gists/',
		apiUsersFolder = 'users/',
		log = logging.forModule('gists')
	;

	function Constructor() {
	}

	function getApiUrlForUserName(username) {
		return apiRootUrl + apiUsersFolder + username + '/gists';
	}

	function getApiUrlForGistId(id) {
		return apiRootUrl + apiGistsFolder + id;
	}

	function getLocalBlogPostUrlForGist(gist) {
		return '/posts/' + gist.id;
	}

	function date(gist) {
		return gist.created_at;
	}

	function getFirstGistFile(gist) {
		return gist.files[_(gist.files).keys()[0]];
	}

	function extractFilenameParts(fileName) {
		var splits = fileName.split(/\./); // dots separate tags (except for the md extension)
		log.info('splits: ', splits);
		if (splits.length === 1 || splits.length === 2) {
			return {fileName: fileName, tags: [] }; // no embedded tags
		}
		else {
			return {fileName: fileName, tags: _.without(splits.slice(1), 'md') };
		}
	}

	function isBlogGist(gist) {
		var firstGistFile = getFirstGistFile(gist);
		var fileName = firstGistFile.filename;
		return (/blog_.+\.md/).test(fileName);
	}

	function getGistHtml(id, callback) {
		getGistMarkdown(id, function (error, gist) {
			if (!error) {
				gconv.convert(gist.markdown, function(convertError, html) {
					if (convertError) { return callback(convertError); }
					return callback(null, gist.markdown, html);
				});
			} else {
				callback(error);
			}
		});
	}

	function getGistMarkdown(id, callback) {
		getGist(id, function (error, gist) {
			// console.log(error);
			// console.log(gist);
			
			if (!error) {
				var firstFile = getFirstGistFile(gist);
				callback(null, { markdown: firstFile.content });
			}
			else {
				callback(error);
			}
		});
	}

	function getGist(id, callback) {
		var url = getApiUrlForGistId(id);
		requestJson(url, function (error, json) {
			// console.log('getGist: got response, error = %s, json = %s', error, JSON.stringify(json));

			if (!error) {
				callback(null, json);
			}
			else {
				callback(error);
			}
		});
	}

	function populateBlogPostContent(post, callback) {
		log.info('requesting raw markdown from %s', post.raw_markdown_url);
		request({url: post.raw_markdown_url, headers: { 'user-agent': 'gistblog'}}, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				// log.info('200 from url (%s) - response headers: %s', post.raw_markdown_url, response.headers);
				log.info('200 from url (%s)', post.raw_markdown_url);

				// store the content in the post fields
				var markdown = body.toString();
				post.content_md = markdown;
				gconv.convert(markdown, function (convertError, html) {
					if (convertError) { return callback(convertError); }
					post.content_html = html;
					return callback(null);
				});
			} else {
				log.error('populateBlogPostContent: error for %s, error = %s', post.id, error);
				callback(error);
			}
		});
	}

	function getBlogPostsForUser(options, callback) {

		var getAllContents = options.allContents === true;
		var url = getApiUrlForUserName(options.username);

		requestJson(url, function (error, json) {

			if (error) {
				// Error
				log.error('error getting gists for user [%s], %s', options.username, error);
				return callback(error);
			}

			var hasValidGistsList = json !== null && json.length > 0;
			if (!hasValidGistsList) {
				log.error('got an empty gist list');
				return callback(new Error("got empty gist list"));
			}

			// convert the gists to our post format
			var posts = toBlogPosts(json);

			if (getAllContents) {
				// caller wants posts with full content, get them in parallel
				async.forEach(posts, populateBlogPostContent, function(asyncError) {
					if (asyncError) { return callback(asyncError); }
					return callback(null, posts);
				});
			}
			else {
				// caller wants posts without full content, give it now
				return callback(null, posts);
			}
		});
	}

	function toBlogPosts(gists) {
		return _.chain(gists)
			.filter(isBlogGist)
			.map(toBlogPost)
			.sortBy(date)
			.reverse()
			.value();
	}

	function toBlogPost(gist, callback) {
		var firstGistFile = getFirstGistFile(gist);
		var hasContent = firstGistFile.content ? true : false;
		return {
			id: Number(gist.id),
			title: gist.description,
			date: new Date(gist.created_at),
			tags: extractFilenameParts(firstGistFile.filename).tags,
			comment_count: gist.comments,
			content_md: firstGistFile.content || null,
			url: getLocalBlogPostUrlForGist(gist),
			gist_url: gist.html_url,
			raw_markdown_url: firstGistFile.raw_url
		};
	}

	function getBlogPost(id, callback) {
		getGist(id, function(error, gist) {
			if (!error) {
				var post = toBlogPost(gist);
				populateBlogPostContent(post, function onContentPopulated(populateError) {
					if (populateError) { return callback(populateError); }
					callback(null, post);
				});
			} else {
				callback(error);
			}
		});
	}

	function requestJson(url, callback) {
		log.info('requesting from %s', url);
		request({url: url, json: true, headers: { 'user-agent': 'gistblog'}}, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				log.info('url (%s) - response headers: %s', url, response.headers);
				callback(null, body);
			}
			else {
				log.error("error getting JSON from %s: error: %s, statusCode: %s", url, error, response.statusCode);
				callback(response.statusCode);
			}
		});
	}

	Constructor.prototype = {
		getBlogPostsForUser: getBlogPostsForUser,
		getBlogPost: getBlogPost,
		getGistMarkdown: getGistMarkdown,
		getGistHtml: getGistHtml
	};

	return Constructor;
}());

module.exports = new Gists();

