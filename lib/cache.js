
var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter
;

var defaultOptions = {

	lastGet: new Date(2000, 1, 1), // the date/time of the last callback (which wasnt an error)
	nonErrorCallbackCount: 0, // the number of times the wrapped method made a callback without an error
	expiryMinutes: 5.0,
	initialCachedValue: null, // when set, prevents the first blocking call
	updateCacheOnCreation: false, // when true, the cached value is updated immediately upon being 'wrapped'

	args: undefined, // the arguments passed to the cached method

	// allows customising the log messages
	getInfoLogMessagePrefix: function getInfoLogMessagePrefix() { return 'INFO [' + new Date().toString() + '] CacheBlockFirstThenAsync: '; },
	getErrorLogMessagePrefix: function getErrorLogMessagePrefix() { return 'ERROR [' + new Date().toString() + '] CacheBlockFirstThenAsync: '; },

	logInfo: function() {
		var args = Array.prototype.slice.call(arguments);
		var message = util.format.apply(this, args);
		message = this.getInfoLogMessagePrefix() + message;
		console.log(message);
	},

	logError: function() {
		var args = Array.prototype.slice.call(arguments);
		var message = util.format.apply(this, args);
		message = this.getErrorLogMessagePrefix() + message;
		console.error(message);
	}
};

// Utility to cache the results of an async method.
//
// The 'cached' method is the method that does some I/O operation. Upon initially
// 'wrapping' the cached method, the cache is automatically refreshed
// asynchronously. If any code attempts to get the cached value *before* is has been
// initially retrieved, it will wait (blocked in the typical node fashion).
//
// However, after the first successful update of the cached value, updating the cache
// happens 'asynchronously'; the caller is never blocked again waiting for the cache to
// be updated.
//
// The returned object has the following methods:
// * function get(function callback(error, value))
//	- gets the cached value, blocking if necessary on the first update
//
// * function update()
//  - updates the cached value asynchronously
//
// * function getOptions()
//  - gets the cache options
//
// function myFn(numbers) { return 6; }
// var myFnCached = cache.cachify(myFn, { args: [1,2,3], expiryMinutes: 2.5 })
// myFnCached.get(function cb(err, value) { if (err) { ... } else { ... } })
//
function CacheBlockFirstThenAsync(fn, cacheOptions) {

	// TODO: validate options?
	var opt = _.extend({}, defaultOptions, cacheOptions);

	// Use 'private' variables for our core logic
	var _isRefreshing = false;
	var _cachedValue = opt.initialCachedValue;
	var _ee = new EventEmitter();
	var _fn = fn;

	// initial configuration
	processCacheOptions(opt);

	function dumpObjectToString(object) {
		return JSON.stringify(object);
		// return util.inspect(opt.args, true, null);
	}

	function processCacheOptions(options) {
		if ('undefined' !== typeof opt.args) {
			opt.logInfo('got args %s', dumpObjectToString(opt.args));
		}

		if (opt.initialCachedValue !== null) {
			opt.logInfo('got initialCachedValue');
			storeNewCachedValue(opt.initialCachedValue);
		}

		// kick of a cache update immediately
		if (opt.updateCacheOnCreation) {
			refreshCachedValueAsync();
		}
	}

	function storeNewCachedValue(value) {
		_cachedValue = value;
		opt.nonErrorCallbackCount++;
		opt.lastGet = new Date();
		opt.logInfo('updated the cached value %s times', opt.nonErrorCallbackCount);
	}

	function refreshCachedValueAsync() {
		_isRefreshing = true;
		_ee.emit('cachedValueRefreshing');

		if ('undefined' !== typeof opt.args) {
			opt.logInfo('getting value with args = %s', dumpObjectToString(opt.args));
		}
		else {
			opt.logInfo('getting new value (no args)');
		}

		fn(opt.args, function wrappedCallback(error, value) {
			_isRefreshing = false;

			if (!error) {
				storeNewCachedValue(value);
			} else {
				opt.logError(dumpObjectToString(error));
			}

			_ee.emit('cachedValueRefreshed', error, value);
		});
	}

	function getCachedValue(callback) {

		if (arguments.length != 1) throw new Error('you must pass only the callback');

		var minutesSinceLastGet = (new Date() - opt.lastGet) / 60000;
		var needsRefresh = minutesSinceLastGet >= opt.expiryMinutes;
		var isRefreshing = _isRefreshing;
		var hasCachedValue = opt.nonErrorCallbackCount > 0 && _cachedValue;

		if (!hasCachedValue) {
			// Once the cached value is updated, the supplied callback will be executed
			// block the caller while waiting for the data
			_ee.once('cachedValueRefreshed', callback);
			refreshCachedValueAsync();

			if (!isRefreshing) {
				opt.logInfo('no value cached yet, blocking the callback until we have data');

			}
			else {
				opt.logInfo('no value cached yet, we are already refreshing, blocking until we have data');
			}
		}
		else {
			if (needsRefresh && isRefreshing) {
				opt.logInfo('needs a cache refresh, but already requested one');
			}
			else if (needsRefresh && !isRefreshing) {
				// refresh without blocking
				opt.logInfo('cache expired, refreshing (asynchronously)');
				refreshCachedValueAsync();
			}

			// return the last cached copy
			opt.logInfo('returning cached value, age = %s', minutesSinceLastGet);
			callback(null, _cachedValue);
		}
	}

	CacheBlockFirstThenAsync.prototype = {
		getCachedValue: getCachedValue,
		refreshCachedValueAsync: refreshCachedValueAsync,
		storeNewCachedValue: storeNewCachedValue,
		processCacheOptions: processCacheOptions,
		dumpObjectToString: dumpObjectToString
	};

	return {
		get: getCachedValue,
		update: refreshCachedValueAsync,
		getOptions: function() { return opt; }
	};
}

module.exports.cachify = CacheBlockFirstThenAsync;

