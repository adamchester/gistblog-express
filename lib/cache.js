
var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter
;

var defaultOptions = {

	lastGet: new Date(2000, 1, 1), // the date/time of the last callback (which wasnt an error)
	nonErrorCallbackCount: 0, // the number of times the wrapped method made a callback without an error
	expiryMinutes: 5.0,
	initialCachedValue: null, // when set, prevents the first blocking call

	args: undefined, // the arguments passed to the cached method

	// allows customising the log messages
	getInfoLogMessagePrefix: function getInfoLogMessagePrefix() { return 'INFO [' + new Date().toString() + '] CacheSyncFirstThenAsync: '; },
	getErrorLogMessagePrefix: function getErrorLogMessagePrefix() { return 'ERROR [' + new Date().toString() + '] CacheSyncFirstThenAsync: '; },

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
		console.log(message);
	}
};

// Wrap an async method so the first time it is executed, the callback
// value is cached. Later, when the cached value expires, the method
// will be called asynchronously (without blocking the caller). If your
// method requires arguments, call like this:
//
// cache.wrap(myFn, { args: [1,2,3], expiryMinutes: 2.5 })
//
function CacheSyncFirstThenAsync(fn, cacheOptions) {

	// TODO: validate options?
	var opt = _.extend({}, defaultOptions, cacheOptions);

	// Use 'private' variables for our core logic
	var _isRefreshing = false;
	var _cachedValue = opt.initialCachedValue;
	var _ee = new EventEmitter();

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
	}

	function storeNewCachedValue(value) {
		opt.logInfo('updating the cached value');

		_cachedValue = value;
		opt.nonErrorCallbackCount++;
		opt.lastGet = new Date();
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

	CacheSyncFirstThenAsync.prototype = {
		processCacheOptions: processCacheOptions,
		refreshCachedValueAsync: refreshCachedValueAsync,
		storeNewCachedValue: storeNewCachedValue
	};

	return function cachedWrapper(callback) {
		
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
	};
}

module.exports.wrap = CacheSyncFirstThenAsync;

