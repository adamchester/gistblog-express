"use strict";

var _ = require('underscore'),
  async = require('async'),
  request = require('request'),
  pyg = require('pygments'),
  logging = require('./logging'),
  marked = require('marked');

var log = logging.forModule('gist-converter');

/**
 * Converts markdown to HTML via the Github API.
 * @param  {String}   markdown The markdown text (GFM).
 * @param  {Function} callback The callback.
 */
exports.toHtmlViaGithub = function toHtmlViaGithub(markdown, callback) {
    // see http://developer.github.com/v3/markdown/
    var url = 'https://api.github.com/markdown';

    var postBody = {
      text: markdown,
      mode: 'gfm',
      context: 'adamchester'
    };

    log.info('requesting markdown conversion via github');
    request.post({url: url, json: postBody, headers: {'user-agent': 'gistblog'} }, function(err, resp, body) {
      if (err || resp.statusCode !== 200) {
        return callback(new Error('Failed to convert markdown, ' + JSON.stringify(err)));
      }

      callback(null, body);
    });
};

function highlightViaPygments(code, lang, onCodeHighlightedCallback) {
    // Pygments - https://github.com/pksunkara/pygments.js
    pyg.colorize(code, lang, 'html', function(colorizedCodeHtml) {
      onCodeHighlightedCallback(null, colorizedCodeHtml || code);
    });
}

/**
 * Converts a Github Gist (GFM Markdown) to HTML.
 * @param  {String}   markdown The GFM.
 * @param  {Function} callback The callback.
 */
exports.convert = function(markdown, callback) {    
  exports.toHtmlViaGithub(markdown, callback);
};
