
var request = require("request")
	, ghm = require("github-flavored-markdown")
	, _ = require("underscore")
	, async = require('async')
;


var Gists = (function() {

	var apiRootUrl = 'https://api.github.com/'
		, apiGistsFolder = 'gists/'
		, apiUsersFolder = 'users/'
		, log = console.log
		, logDebug = function() {} // console.log
	;

	function Constructor() {
    }

    function getApiUrlForUserName(username) {
		return apiRootUrl + apiUsersFolder + username + '/gists';
    }

    function getApiUrlForGistId(id) {
		return apiRootUrl + apiGistsFolder + id;
    }

    function toViewModel(gist) {
		return {
			raw_url: getFirstGistFile(gist).raw_url,
		  	id: gist.id,
		  	description: gist.description,
		  	created_at: new Date(gist.created_at),
		  	url: 'https://gist.github.com/' + gist.id,
		  	comments: gist.comments
		};
    }

    function date(gist) {
		return gist.created_at;
    }

    function gistsToViewModel(gists) {
    	// logDebug('gistsToViewModel: %s', JSON.stringify(gists))
		return {
			gists: _.chain(gists)
				.filter(isBlogGist)
				.map(toViewModel)
				.sortBy(date)
				.value().reverse()
		};
    }

    function getFirstGistFile(gist) {
		return gist.files[_(gist.files).keys()[0]];
    }

    function isBlogGist(gist) {
		var firstGistFile = getFirstGistFile(gist);
		var fileName = firstGistFile.filename;
		return /blog_.+\.md/.test(fileName);
    }

    function getGistMarkdown(id, callback) {
		getGist(id, function (gist, error) {
			if (!error) {
				var firstFile = getFirstGistFile(gist);
				callback({ markdown: firstFile.content });
			}
			else {
				callback(null, error);
			}
		});
    }

    function getGistHtml(id, callback) {
		getGistMarkdown(id, function (gist, error) {
			if (!error) {
				var html = ghm.parse(gist.markdown);
				callback(gist.markdown, html);
			} else {
				callback(null, null, error);
			}
		});
    }

    function getGist(id, callback) {

		var url = getApiUrlForGistId(id);
		requestJson(url, function (json, error) {
			if (!error) {
				callback(json);
			}
			else {
				callback(null, error);
			}
		});
    }

    function getBlogPosts(username, callback) {

		var url = getApiUrlForUserName(username);

		requestJson(url, function (json, error) {
			if (!error && json !== null && json.length > 0) {
				logDebug('converting %s to posts format', JSON.stringify(json));
				var posts = gistsToViewModel(json);
				callback(posts);
			}
			else {
				if (json !== null && json.length === 0) {
					log('getBlogPosts: got an empty gist list');
				}
				else {
					log('error getting gists for user [%s], %s', username, error);
				}
				callback(null, error);
			}
		});
    }

    function toBlogPost(gist) {
    	return { 
    		id: gist.id,
    		title: gist.description, 
    		date: gist.created_at,
    		comment_count: gist.comments,
    		content_md: '',
    		content_html: '',
    		url: '/post/' + gist.id,
    		gist_url: 'https://gist.github.com/' + gist.id,
    		raw_url: gist.raw_url 
    	};
    }

    function populateBlogPostContent(post, callback) {

    	getGistHtml(post.id, function(markdown, html, error) {
    		if (!error) {
     			// store the content in the post fields
    			post.content_md = markdown;
    			post.content_html = html;
    			callback();
    		} else {
	   			log('populateBlogPostContent: error for %s, error = %s', post.id, error);
    			callback(error);
    		}
    	});
    }

    function getAllBlogPostsContent(username, callback) {

    	getBlogPosts(username, function(gists, error){

    		if (!error) {
    			// convert gists to blog posts
    			var posts = _.chain(gists.gists).map(toBlogPost).value();

    			// retrieve the content of each post
    			async.forEach(posts, populateBlogPostContent, function(asyncError) {
    				
	    			if (!asyncError) {
	    				callback(posts);
	    			} else {
	    				callback(null, asyncError);
	    			}
    			});
    		} else {
    			callback(null, error);
   			}
    	});
    }

    function requestJson(url, callback) {
		logDebug('requesting from %s', url);

		request({url: url, json: true}, function (error, response, body) {

			if (!error && response.statusCode === 200) {
				// console.log(JSON.stringify(body));
				callback(body);
			}
			else {
				log("error getting JSON from %s: error: %s, statusCode: %s", url, error, response.statusCode);
				callback(null, response.statusCode);
			}
		});
    }

    Constructor.prototype = {
		getBlogPosts: getBlogPosts
		, getGistMarkdown: getGistMarkdown
		, getGistHtml: getGistHtml
		, requestJson: requestJson
		, getAllBlogPostsContent: getAllBlogPostsContent
	};

	return Constructor;
})();


module.exports = new Gists();

