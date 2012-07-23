
var _ = require('underscore'),
  pyg = require('pygments'),
  marked = require('./marked-async');

// Use a modified version of 'marked' - https://github.com/chjj/marked/issues/47
exports.convert = function(markdown, callback) {
  
  function highlightViaPygments(code, lang, onCodeHighlightedCallback) {
      // Pygments - https://github.com/pksunkara/pygments.js
      pyg.colorize(code, lang, 'html', function(colorizedCodeHtml) {
        onCodeHighlightedCallback(null, colorizedCodeHtml);
      });
  }

  marked.setOptions({
    gfm: true, // required for the ``` syntax to work correctly
    highlight: highlightViaPygments
  });

  marked.async(markdown, function(err, text) {
    callback(err, text);
  });
};
