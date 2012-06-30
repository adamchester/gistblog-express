
var request = require("request")
	, md = require('github-flavored-markdown').parse
	, _ = require("underscore");


var Gists = (function() {

	var lastGet = new Date(2000,1,1)
		, apiRootUrl = 'https://api.github.com/'
		, apiGistsFolder = 'gists/'
		, apiUsersFolder = 'users/'
		, viewModelCache = undefined;

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
			markdown: 'todo', // TODO: get markdown contents from github and put here?
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
			if (error) {
				callback(null, error);
			}
			else {
				var firstFile = getFirstGistFile(gist);
				callback({ markdown: firstFile.content });
			}
		});
    }

    function getGistHtml(id, callback) {
		getGistMarkdown(id, function (gist, error) {
			if (error) {
				callback(null, error);
			} else {
				var html = md(gist.markdown);
				callback({ markdown: gist.markdown, html: html });
			}
		});
    }

    function getGist(id, callback) {

		var url = getApiUrlForGistId(id);
		requestJson(url, function (json, error) {
			if (error) {
				callback(null, error);
			}
			else {
				callback(json);
			}
		});
    }

    function getGists(username, callback) {

		var age = (new Date() - lastGet) / 60000;
		var url = getApiUrlForUserName(username);

		// TODO: need a better way to cache this, and stop doing it in this method/module
		// note: this cache doesn't take the username into account

 		if (age > 5) {
			requestJson(url, function (json, error) {
				if (error) {
					console.log('error getting gists for user [%s], %s', username, error);
					callback(null, error);
				}
				else {
					// console.log('converting %s to view model cache', JSON.stringify(json));
					viewModelCache = gistsToViewModel(json);
					lastGet = new Date();
					callback(viewModelCache);
				}
			});
		}
		else
		{
			// cached viewModel has *not* expired
			callback(viewModelCache);
		}
    }

    function requestJson(url, callback) {
		console.log('requesting from %s', url);
		request({url: url, json: true}, function (error, response, body) {
			if (error || response.statusCode !== 200) {
				console.log("error getting JSON from %s: %s", url, error);
				callback(null, response.statusCode);
			}
			else {
				// console.log(body);
				callback(body);
			}
		});
    }

    Constructor.prototype = {
		getGists: getGists
		, getGistMarkdown: getGistMarkdown
		, getGistHtml: getGistHtml
		, requestJson: requestJson

	};

	return Constructor;
})();


module.exports = new Gists();

