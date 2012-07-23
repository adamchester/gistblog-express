/*jshint node: true */

/**
* error handling middleware loosely based off of the connect/errorHandler code.
* This handler chooses
* to render errors using Jade / Express instead of the manual templating used by
* the connect middleware
* sample.  This may or may not be a good idea :-)
* @param {object} options array of options.
* @return {Function} The exported error handler function.
**/
module.exports = function errorHandler(options) {
  'use strict';
  var NotFound = require('../lib/errors').NotFound;

  options = options || {};

  // defaults
  var showStack = options.showStack || options.stack,
  showMessage = options.showMessage || options.message,
  dumpExceptions = options.dumpExceptions || options.dump,
  formatUrl = options.formatUrl;
  var _ = require('underscore');

  return function errorHandler(err, req, res, next) {
    res.statusCode = 500;
    if (dumpExceptions) { console.error(err.stack); }
    var app = res.app;

    if (err instanceof NotFound) {
      res.render('errors/404', { locals: {
        title: '404 - Not Found'
      }, status: 404
    });
    } else {
      res.render('errors/500', {
          title: 'The Server Encountered an Error',
          error: _.escape(err.stack).replace(/\n/g, '<br />'),
          status: 500
      });
    }
  };
};
