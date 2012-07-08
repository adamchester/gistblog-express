
_ = require 'underscore'
th = require './test_helpers'
assert = require 'assert'
cache = require '../lib/cache'

describe 'cache', ->
	describe 'AsyncMethod', ->

		it 'should execute the callback', (done) ->
			wasMockMethodCalled = false
			methodToCache = (opt, cb) -> wasMockMethodCalled = true; cb()
			target = new cache.AsyncMethod({method: methodToCache, args: {}})
			target.execute {}, (value, error) -> assert wasMockMethodCalled; done()
			
		it 'should call the method with the correct arguments', (done) ->
			wasMockMethodCalled = false
			expectedArgs = id: 1, name:'one'
			methodToCache = (opt, cb) -> wasMockMethodCalled = true; assert.deepEqual(expectedArgs, opt); cb()
			target = new cache.AsyncMethod({method: methodToCache, args: expectedArgs})
			target.execute {}, (value, error) -> assert wasMockMethodCalled; done()

		it 'should return the cached result on the 2nd execution', (done) ->
			callbackCount = 0
			expectedArgs = id: 1, name:'one'
			methodToCache = (opt, cb) -> callbackCount++; cb()
			target = new cache.AsyncMethod({method: methodToCache, args: expectedArgs})

			target.execute {call:1}, (value, error) -> 
				target.execute {call:2}, (value, error) -> 
					assert callbackCount == 1, 'callback count should be 1 (methodToCache should not have been executed twice)'
					done()

	# it 'should call the method on the first call to execute', (done) ->
	# 	wasMockMethodCalled = false
	# 	mockAsyncMethodResult = {myField: 1}
	# 	mockAsyncMethodArgs = {id: 1}
	# 	mockAsyncMethod = (options, callback) -> 
	# 		wasMockMethodCalled = true
	# 		assert options is mockAsyncMethodArgs
	# 		callback(mockAsyncMethodResult)
		
	# 	cachedMethod = new cache.CachedMethod(mockAsyncMethodArgs, mockAsyncMethod)

	# 	cachedMethod.execute {opt:1}, (value, error) ->
	# 		assert value is mockAsyncMethodResult, 'expected execute to return the correct result'
	# 		assert error is undefined, 'expected the error to be undefined'
	# 		assert wasMockMethodCalled, 'expected the mock method to be called'
	# 		done()
