
var util = require('util'),
	_ = require('underscore')
;

function makeLogKind(prefix, fn) {
	if (prefix !== 'ERROR' && prefix !== 'INFO') {
		throw new Error('the prefix must be ERROR or INFO');
	}

	return {prefix: prefix, prefixer: getLogMessagePrefix, fn: fn };
}

function makeDefaultLogKinds() {
	return {
		error: makeLogKind('ERROR', console.error),
		info: makeLogKind('INFO', util.log)
	};
}

var logKind = makeDefaultLogKinds();

function getLogMessagePrefix(kind, moduleName) {
	var afterTimestamp = kind.prefix + ' (' + moduleName + '): ';

	if (kind.fn === util.log) {
		// special-case for util.log - it outputs a nice date for us
		return afterTimestamp;
	}
	else {
		return '' + new Date().toJSON() + ' ' + afterTimestamp;
	}
}

function jsonifyObjectsInArray(array) {
	for (var i = array.length - 1; i >= 0; i--) {
		var item = array[i];
		if (item && '[object Object]' === item.toString()) {
			array[i] = JSON.stringify(item);
		}
	}
}

function logWithKindPrefix(kind, moduleName, messageFormatArgs) {
	if (!kind.fn) return; // do nothing if function is null

	// automatically JSON-ify objects
	var formatArgsArr = Array.prototype.slice.call(messageFormatArgs);
	jsonifyObjectsInArray(formatArgsArr);

	var message = util.format.apply(this, formatArgsArr);

	if (kind.prefixer) {
		message = kind.prefixer(kind, moduleName) + message;
	}

	kind.fn(message);
}

function getLogKindByName(kind) {
	var lk = logKind[kind];

	if (!lk) {
		var message = util.format('the kind %s is unknown, try { %s }', kind, _.keys(logKind).join(', '));
		throw new Error(message);
	}

	return lk;
}

module.exports.setPrefixer = function setPrefixer(kind, fn) {
	var lk = getLogKindByName(kind);
	lk.prefixer = fn;
};

module.exports.setLogger = function setLogger(kind, fn, prefixer) {
	var lk = getLogKindByName(kind);
	lk.fn = fn;
	lk.prefixer = prefixer;
};

module.exports.resetDefaults = function resetDefaults() {
	logKind = makeDefaultLogKinds();
};

module.exports.forModule = function getLoggerForModule(moduleName) {
	return {
		error: function() { logWithKindPrefix(logKind.error, moduleName, arguments); },
		info: function() { logWithKindPrefix(logKind.info, moduleName, arguments); }
	};
};
