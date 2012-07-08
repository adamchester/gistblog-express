
var _ = require('underscore'),
	util = require('util')
;

var defaultOptions = {

	lastGet: new Date(2000, 1, 1), // the date/time of the last callback (which wasnt an error)
	nonErrorCallbackCount: 0, // the number of times the wrapped method made a callback without an error
	expiryMinutes: 5.0,
	initialCachedValue: null, // when set, prevents the first blocking call
	
	args: undefined, // the arguments passed to the cached method

	// allows customising the log messages
	getInfoLogMessagePrefix: function getInfoLogMessagePrefix() { return 'INFO [' + new Date().toString() + '] cache: '; },
	getErrorLogMessagePrefix: function getErrorLogMessagePrefix() { return 'ERROR [' + new Date().toString() + '] cache: '; },

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
// will be called asynchronously (without blocking the caller)
// WARNING: TODO: this doesn't handle changing arguments correctly
function WrapBlockFirstThenAsyncUpdate(fn, cacheOptions) {

	// TODO: validate options?
	var opt = _.extend({}, defaultOptions, cacheOptions);
	var _isRefreshing = false;
	var _cachedValue = opt.initialCachedValue;
	var _additionalBlockedCallbacks = [];

	if ('undefined' !== typeof opt.args) {
		opt.logInfo('got args %s', opt.args);
	}

	if (opt.initialCachedValue !== null) {
		opt.logInfo('got initialCachedValue');
		updateCachedValue(opt.initialCachedValue);
	}

	function updateCachedValue(value) {
		opt.logInfo('updating the cached value');

		_cachedValue = value;
		opt.nonErrorCallbackCount++;
		opt.lastGet = new Date();
	}

	function callWrappedAndStoreCached(callback) {

		_isRefreshing = true;

		if ('undefined' !== typeof opt.args) {
			opt.logInfo('getting value with args = %s', JSON.stringify(opt.args));
		}

		fn(opt.args, function wrappedCallback(error, value) {
			_isRefreshing = false;

			if (!error) {
				updateCachedValue(value);
			} else {
				opt.logError(JSON.stringify(error));
			}

			// TODO: what happens if any callback throws an error ?
			// // prior to the first cache value being obtained, we may get may callers
			// // waiting on the result. fire them all now.
			// _.each(_additionalBlockedCallbacks, function(additionalCallback) {
			//	additionalCallback(error, value);
			// });
			// // clear the additional blocked callers
			// _additionalBlockedCallbacks.length = 0;

			// do this last, as the method may get called again
			callback(error, value);
		});
	}

	WrapBlockFirstThenAsyncUpdate.prototype.callWrappedAndStoreCached = callWrappedAndStoreCached;

	return function cachedWrapper(callback) {
		
		if (arguments.length != 1) throw new Error('you must pass only the callback');

		var minutesSinceLastGet = (new Date() - opt.lastGet) / 60000;
		var needsRefresh = minutesSinceLastGet >= opt.expiryMinutes;
		var isRefreshing = _isRefreshing;
		var hasCachedValue = opt.nonErrorCallbackCount > 0 && _cachedValue;

		if (!hasCachedValue) {

			if (!isRefreshing) {
				// block the caller while waiting for the data
				opt.logInfo('no value cached, executing for the first time');
				callWrappedAndStoreCached(callback);
			}
			else {
				opt.logInfo('no cached value yet, but already waiting on a refresh');
				// opt.logInfo('adding to \'additional callbacks\' list');
				// _additionalBlockedCallbacks.push(callback);
				callback(new Error('no support for this scenario yet!'));
			}
		}
		else {
			if (needsRefresh && isRefreshing) {
				opt.logInfo('needs a cache refresh, but already requested one');
			}
			else if (needsRefresh && !isRefreshing) {
				// refresh without blocking
				opt.logInfo('cache expired, refreshing (asynchronously)');
				callWrappedAndStoreCached(function() {});
			}

			// return the last cached copy
			opt.logInfo('returning cached value, age = %s', minutesSinceLastGet);
			callback(null, _cachedValue);
		}
	};
}

module.exports.wrap = WrapBlockFirstThenAsyncUpdate;

