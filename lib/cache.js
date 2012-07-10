
var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter
;

var defaultOptions = {

	expiryMinutes: 5.0,
	initialCachedValue: null, // when set, prevents the first blocking call
	updateCacheOnCreation: false, // when true, the cached value is updated immediately upon being 'wrapped'

	args: undefined, // the arguments passed to the cached method
	cacheName: undefined, // if specified, that value will be used instead of the fn.name

	// allows customising the log messages
	getInfoLogMessagePrefix: function getInfoLogMessagePrefix() { return 'INFO [' + new Date().toJSON() + '] (' + this.cacheName + '): '; },
	getErrorLogMessagePrefix: function getErrorLogMessagePrefix() { return 'ERROR [' + new Date().toJSON() + '] (' + this.cacheName + '): '; },

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

	validateArguments(fn, cacheOptions);

	// Use 'private' variables for our core logic
	var opt = _.extend({}, defaultOptions, cacheOptions);
	var _fnName = fn.name;
	var _hasArgs = cacheOptions ? ('undefined' !== typeof cacheOptions.args) : false;
	var _lastGet = new Date(2000, 1, 1); // the date/time of the last callback (which wasnt an error)
	var _numTimesGotNewCachedValue = 0; // the number of times the wrapped method made a callback without an error
	var _isRefreshing = false;
	var _cachedValue = opt.initialCachedValue;
	var _ee = new EventEmitter();

	// initial configuration
	processCacheOptions(opt);

	function dumpObjectToString(object) {
		return JSON.stringify(object);
		// return util.inspect(opt.args, true, null);
	}

	function validateArguments(fn, cacheOptions) {
		// validation arguments / options
		if (!fn) throw new Error('the function to cache must be provided');
		if (!_.isFunction(fn)) throw new TypeError('the fn argument must be a function');

		var hasArgsInCacheOptions = cacheOptions ? ('undefined' !== typeof cacheOptions.args) : false;

		// TODO: is there a better way to get parameters programatically?
		function getParamNames(func) {
			var funStr = func.toString();
			return funStr.slice(funStr.indexOf('(')+1, funStr.indexOf(')')).match(/([^\s,]+)/g);
		}

		var fnParamNames = getParamNames(fn);
		if (fnParamNames.length < 1 || fnParamNames.length > 2) {
			throw new Error("the cached method must have either one or two parameters; (options, callback) or (callback)");
		}

		// make sure the cached method argument count and the cacheOptions.args match
		if (hasArgsInCacheOptions && fnParamNames.length !== 2) {
			throw new Error("args was specified in the cacheOptions, however the method (fn) doesnt accept 2 arguments");
		}
		else if (!hasArgsInCacheOptions && fnParamNames.length !== 1) {
			throw new Error("args should be specified in the cacheOptions, because the method (fn) requires more than 1 argument");
		}
	}

	function processCacheOptions(options) {

		if (!options.cacheName) {
			options.cacheName = _fnName;
		}

		if (_hasArgs) {
			opt.logInfo('got args %s', dumpObjectToString(opt.args));
		}

		if (opt.initialCachedValue !== null) {
			opt.logInfo('got initialCachedValue');
			storeNewCachedValue(opt.initialCachedValue);
		}

		// kick of the function immediately
		if (opt.updateCacheOnCreation) {
			refreshCachedValueAsync();
		}
	}

	function storeNewCachedValue(value) {
		_cachedValue = value;
		_lastGet = new Date();
		_numTimesGotNewCachedValue++;
		opt.logInfo('updated the cached value %s times', _numTimesGotNewCachedValue);
	}

	function onFnCallback(error, value) {
		_isRefreshing = false;

		if (!error) {
			storeNewCachedValue(value);
		} else {
			opt.logError('unable to update, got error callback: %s', dumpObjectToString(error));
		}

		_ee.emit('cachedValueRefreshed', error, value);
	}

	function refreshCachedValueAsync() {

		opt.logInfo('refreshing the cached value');
		_isRefreshing = true;
		_ee.emit('cachedValueRefreshing');

		// call the cahed method with the correct arguments
		var args = _hasArgs ? [opt.args, onFnCallback] : [onFnCallback];
		fn.apply(this, args);
	}

	function getCachedValue(callback) {

		if (arguments.length != 1) throw new Error('you must pass only the callback');
		if (!_.isFunction(callback)) throw new TypeError('the callback must be a function');

		var minutesSinceLastGet = (new Date() - _lastGet) / 60000;
		var needsRefresh = minutesSinceLastGet >= opt.expiryMinutes;
		var isRefreshing = _isRefreshing;
		var hasCachedValue = _numTimesGotNewCachedValue > 0 && _cachedValue;

		if (!hasCachedValue) {
			if (!isRefreshing) {
				opt.logInfo('no value cached yet, blocking the callback until we have data');

			}
			else {
				opt.logInfo('no value cached yet, we are already refreshing, blocking until we have data');
			}

			// Once the cached value is updated, the supplied callback will be executed
			// block the caller while waiting for the data
			_ee.once('cachedValueRefreshed', callback);
			refreshCachedValueAsync();
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
		onFnCallback: onFnCallback,
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

