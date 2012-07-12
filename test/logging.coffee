
describe 'logging', ->
	assert = require('assert')
	logging = require '../lib/logging'
	th = require './test_helpers'
	_ = require 'underscore'

	# helpers
	isFunction = th.isFunction
	expectedLoggerFields = ['info', 'error']

	# message prefix helpers
	testPrefixMessage = (kind) -> "[date] #{kind.toUpperCase()} (test): ".toString()
	testPrefixer = (kind, moduleName) -> testPrefixMessage(kind.prefix)
	assertLogMessageEquals = (actual, kind, expectedWithoutTestPrefix) ->
		assert.equal actual, (testPrefixMessage(kind) + expectedWithoutTestPrefix)

	it 'should export itself', -> assert logging
	it 'should export a function called forModule', -> assert isFunction logging.forModule
	it 'should export a function called setLogger', -> assert isFunction logging.setLogger

	describe 'method', ->
		describe '#setLogger()', ->
			it 'should throw an error when provided with an unexpected log kind', ->
				assert.throws -> logging.setLogger('zzzzzzz')

			it 'should not throw an error when provided with an expected log kind', ->
				assert.doesNotThrow -> logging.setLogger('error')

			it 'should cause future loggers from forModule to use the new logger', ->
				msgs = []
				logging.setLogger 'error', (msg) -> msgs.push(msg)
				logger = logging.forModule 'thisTest'
				logger.error 'test'
				assert.equal msgs.length, 1

		describe '#forModule()', ->
			it 'should return a different logger if called more than once for the same module name', ->
				logger1 = logging.forModule 'test'
				logger2 = logging.forModule 'test'
				assert.notEqual logger1, logger2

			it 'should return a function which allows logging via methods [info, error]', ->
				logger = logging.forModule 'test'
				th.assertHasFields logger, expectedLoggerFields		
				assert isFunction logger[field] for field in expectedLoggerFields

		describe 'logger.[kind] (via #forModule())', ->
			it 'should format arrays as JSON', ->
				for kind in expectedLoggerFields
					msgs = []
					logging.setLogger(kind, ((msg) -> msgs.push(msg)), testPrefixer)
					log = logging.forModule("test")[kind]

					log 'a format test %s', [1,2,3]
					assertLogMessageEquals msgs[0], kind, 'a format test 1,2,3'
					
					log 'another format %s test %s', [{one:1, two:2}], [{threePointOne: 3.1}]
					assertLogMessageEquals msgs[1], kind, 'another format [{"one":1,"two":2}] test [{"threePointOne":3.1}]'
