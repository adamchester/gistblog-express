"use strict";

var s = require('../lib/shared'),
    util = require('util')
    // cache = require('../lib/cache')
;

module.exports.topLevelPages = s.topLevelPages;

function sharedLayoutMiddleware (req, res, next) {
    var app = req.app;
    var topLevelPage = res.locals.topLevelPage;

    // NOTE: topLevelPages.none || null || undefined is a valid top level page
    s.getSharedLayoutViewModel(topLevelPage, function gotSharedViewModel (err, model) {
        if (err) { return next(err); }

        res.locals({ shared: model });

        // allow the next piece of middleware to execute
        next();
    });
}

module.exports.withSharedLayout = function () {
    return function (req, res, next) {
        res.locals.topLevelPage = s.topLevelPages.none;
        return sharedLayoutMiddleware (req, res, next);
    };
};

/**
 * this piece of middleware adds a variable named 'shared' to the model
 * that always refers to the shared (layout) view model
 **/
module.exports.forTopLevelPage = function (topLevelPage) {

    if (!s.isTopLevelPage(topLevelPage)) {
        var msg = util.format('No such top level page: %j', topLevelPage);
        throw new Error(msg);
    }

    return function (req, res, next) {
        res.locals.topLevelPage = topLevelPage;
        return sharedLayoutMiddleware(req, res, next);
    };
};
