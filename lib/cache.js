
var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events').EventEmitter,
	logging = require('./logging')
;

// Options *not* changable from the outside (at least, not globally)
var defaultCacheOptions = {
	args: undefined, // the arguments passed to the cached method
	cacheName: undefined, // if specified, that value will be used instead of the fn.name
	initialCachedValue: null, // when set, prevents the first blocking call
	updateCacheOnCreation: false // when true, the cached value is updated immediately upon being 'wrapped'
};

// Options changable from the outside (globally)
var globalPublicOptions = {
	expiryMinutes: 5.0,

	// Allow configuring the logger that is used. NOTE: this method is
	// only called once during cachify(), the returned 'logger' must have the methods:
	// * error (message, [formatArgs...])
	// * info (message, [formatArgs...])
	getLogger: function() { return logging.forModule(this.cacheName); }
};


module.exports.getOption = function getOption(name) {
	return globalPublicOptions[name];
};

module.exports.setOption = function setOption(name, value) {
	return globalPublicOptions[name] = value;
};

module.exports.getOptions = function() {
	return _(globalPublicOptions).keys();
};

function dumpObjectToString(object) {
	//return JSON.stringify(object); // more condensed format
	return util.inspect(object, true, null);
}

// note: these must match the method names exported by logging.getLogger()
var lk = { info: 'info', error: 'error' };

function LogMessage(kind, message, formatArgNames) {
	this.kind = kind;
	this.message = message;
	this.formatArgNames = formatArgNames || [];
	return this;
}

function newLogFormatter(lk, message, formatArgName) {
	return function formatter(/* logger, [formatArgs...] */) {
		this.data = new LogMessage(lk, message, [formatArgName]);
		var argsArray = Array.prototype.slice.call(arguments);
		var logger = argsArray[0];
		var formatArgsArray = [].concat.call([message], argsArray.slice(1)); // first arg is the logging.logger
		var logMethod = logger[lk];
		logMethod.apply(null, formatArgsArray);
	};
}

var logMessage = {
	gotInitialCachedValue:					newLogFormatter(lk.info, 'got initialCachedValue'),
	updatedCachedValueNtimes:				newLogFormatter(lk.info, 'updated the cached value %s times', 'nTimes'),
	gotArgs:								newLogFormatter(lk.info, 'got args %s', 'args'),
	refreshFailedWithFnCallbackError:		newLogFormatter(lk.error, 'unable to refresh, got error callback: %s', 'error'),
	refreshingTheCachedValue:				newLogFormatter(lk.info, 'refreshing the cached value'),
	noCachedValueAndNotAlreadyRefreshing:	newLogFormatter(lk.info, 'no value cached yet, blocking the callback until we have data'),
	noCachedValueAndAlreadyRefreshing:		newLogFormatter(lk.info, 'no value cached yet, we are already refreshing, blocking until we have data'),
	needCacheRefreshButAlreadyRequested:	newLogFormatter(lk.info, 'needs a cache refresh, but already requested one'),
	cacheExpiredAndTriggeringRefresh:		newLogFormatter(lk.info, 'cache expired, refreshing (asynchronously)'),
	returningCachedValueAgeInMinutes:		newLogFormatter(lk.info, 'returning cached value, age = %s', 'ageInMinutes')
};

var error = {
	ArgFnIsMandatory:					'The fn (cached method) is mandatory',
	ArgFnMustBeFunction:				'The fn (cached method) must be a Function',
	ArgFnInvalidParameterCount:			'The fn (cached method) must have either one or two parameters; (options, callback) or (callback)',
	ArgsSpecifiedWhenFnDoesntAcceptIt:	'\'args\' was specified in the cacheOptions, however the fn (cached method) doesnt accept 2 arguments',
	ArgsMustSpecifiedWhenFnRequiresMultipleParams: '\'args\' should be specified in the cacheOptions, because the fn (cached method) requires more than 1 argument',
	MustHaveOnlyCallback:				'Only the callback parameter is allowed',
	CallbackMustFunction:				'The callback must be a function'
};

function NewError(error) {
	return new Error(error);
}

var events = {
	cachedValueRefreshing: 'cachedValueRefreshing',
	cachedValueRefreshed: 'cachedValueRefreshed'
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
	var opt = _.extend({}, globalPublicOptions, defaultCacheOptions, cacheOptions);
	var _fnName = fn.name;

	// if opt.cacheName is *not* set by now, make sure we set it
	opt.cacheName = opt.cacheName || _fnName || 'unnamed cache';

	var _log = opt.getLogger(); // must happen after cacheName is configured
	var _hasArgs = cacheOptions ? ('undefined' !== typeof cacheOptions.args) : false;
	var _lastGet = new Date(2000, 1, 1); // the date/time of the last callback (which wasnt an error)
	var _numTimesGotNewCachedValue = 0; // the number of times the wrapped method made a callback without an error
	var _isRefreshing = false;
	var _cachedValue = opt.initialCachedValue;
	var _ee = new EventEmitter();

	// initial configuration
	processCacheOptions(opt);

	function validateArguments(fn, cacheOptions) {
		// validation arguments / options
		if (!fn) throw NewError(errorsArgFnIsMandatory);
		if (!_.isFunction(fn)) throw NewError(ArFnMustBeFunction);

		var hasArgsInCacheOptions = cacheOptions ? ('undefined' !== typeof cacheOptions.args) : false;

		// TODO: is there a better way to get parameters programatically?
		function getParamNames(func) {
			var funStr = func.toString();
			return funStr.slice(funStr.indexOf('(')+1, funStr.indexOf(')')).match(/([^\s,]+)/g);
		}

		var fnParamNames = getParamNames(fn);
		if (fnParamNames.length < 1 || fnParamNames.length > 2) {
			throw NewError(ArgFnInvalidParameterCount);
		}

		// make sure the cached method argument count and the cacheOptions.args match
		if (hasArgsInCacheOptions && fnParamNames.length !== 2) {
			throw NewError(msg.ArgsSpecifiedWhenFnDoesntAcceptIt);
		}
		else if (!hasArgsInCacheOptions && fnParamNames.length !== 1) {
			throw NewError(ArgsMustSpecifiedWhenFnRequiresMultipleParams);
		}
	}

	function processCacheOptions(options) {

		if (_hasArgs) {
			logMessage.gotArgs(_log, opt.args);
		}

		if (opt.initialCachedValue !== null) {
			logMessage.gotInitialCachedValue(_log);
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
		logMessage.updatedCachedValueNtimes(_log, _numTimesGotNewCachedValue);
	}

	function onFnCallback(error, value) {
		_isRefreshing = false;

		if (!error) {
			storeNewCachedValue(value);
		} else {
			logMessage.refreshFailedWithFnCallbackError(_log, error);
		}

		_ee.emit(events.cachedValueRefreshed, error, value);
	}

	function refreshCachedValueAsync() {

		logMessage.refreshingTheCachedValue(_log);
		_isRefreshing = true;
		_ee.emit(events.cachedValueRefreshing);

		// call the cahed method with the correct arguments
		var args = _hasArgs ? [opt.args, onFnCallback] : [onFnCallback];
		fn.apply(this, args);
	}

	function getCachedValue(callback) {

		if (arguments.length != 1) throw errors.MustHaveOnlyCallback();
		if (!_.isFunction(callback)) throw errors.CallbackMustBeFunction();

		var minutesSinceLastGet = (new Date() - _lastGet) / 60000;
		var needsRefresh = minutesSinceLastGet >= opt.expiryMinutes;
		var isRefreshing = _isRefreshing;
		var hasCachedValue = _numTimesGotNewCachedValue > 0 && _cachedValue;

		if (!hasCachedValue) {
			if (!isRefreshing) {
				logMessage.noCachedValueAndNotAlreadyRefreshing(_log);

			}
			else {
				logMessage.noCachedValueAndAlreadyRefreshing(_log);
			}

			// Once the cached value is updated, the supplied callback will be executed
			// block the caller while waiting for the data
			_ee.once(events.cachedValueRefreshed, callback);
			refreshCachedValueAsync();
		}
		else {
			if (needsRefresh && isRefreshing) {
				logMessage.needCacheRefreshButAlreadyRequested(_log);
			}
			else if (needsRefresh && !isRefreshing) {
				// refresh without blocking
				logMessage.cacheExpiredAndTriggeringRefresh(_log);
				refreshCachedValueAsync();
			}

			// return the last cached copy
			logMessage.returningCachedValueAgeInMinutes(_log, minutesSinceLastGet);
			callback(null, _cachedValue);
		}
	}

	CacheBlockFirstThenAsync.prototype = {
		onFnCallback: onFnCallback,
		getCachedValue: getCachedValue,
		refreshCachedValueAsync: refreshCachedValueAsync,
		storeNewCachedValue: storeNewCachedValue,
		processCacheOptions: processCacheOptions,
		validateArguments: validateArguments
	};

	return {
		get: getCachedValue,
		update: refreshCachedValueAsync,
		getOptions: function() { return opt; }
	};
}

module.exports.cachify = CacheBlockFirstThenAsync;

