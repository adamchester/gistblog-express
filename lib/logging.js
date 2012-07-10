
var util = require('util'),
	_ = require('underscore')
;

function makeLogKind(prefix, fn) {
	if (prefix !== 'ERROR' && prefix !== 'INFO') {
		throw new Error('the prefix must be ERROR or INFO');
	}

	return {prefix: prefix, fn: fn };
}

var logKind = {
	error: makeLogKind('ERROR', console.error),
	info: makeLogKind('INFO', console.log)
};

function getLogMessagePrefix(kind, moduleName) {
	return '[' + new Date().toJSON() + '] ' + kind.prefix + ' (' + moduleName + '): ';
}

function logWithKind(kind, moduleName, messageFormatArgs) {
	if (!kind.fn) return; // do nothing if function is null
	var messageFormatArgsArray = Array.prototype.slice.call(messageFormatArgs);
	var message = util.format.apply(this, messageFormatArgsArray);
	message = getLogMessagePrefix(kind, moduleName) + message;
	kind.fn(message);
}

module.exports.setLogger = function setLogger(kind, fn) {
	logKind[kind].fn = fn;
};

module.exports.forModule = function getLoggerForModule(moduleName) {
	return {
		error: function() { logWithKind(logKind.error, moduleName, arguments); },
		info: function() { logWithKind(logKind.info, moduleName, arguments); }
	};
};
