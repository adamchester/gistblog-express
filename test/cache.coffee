
_ = require 'underscore'
th = require './test_helpers'
assert = require 'assert'
cache = require '../lib/cache'

describe 'cache', ->

	describe 'wrap', ->

		it 'should execute the cached method', (done) ->
			methodToCache = (opt, cb) -> cb() # just call back
			cachedMethod = cache.wrap(methodToCache)
			cachedMethod (error, value) -> assert.ifError(error); done()

		it 'should execute the callback with an error when the initial caching gives an error', ->
			expectedError = new Error('test error')
			methodToCache = (opt, cb) -> cb(expectedError)
			cachedMethod = cache.wrap(methodToCache)
			cachedMethod (error, value) ->
				assert value is undefined, 'should recieve \'undefined\' for value when initial cache update results in an error'
				assert error, 'the error should be truthy'
				assert.equal expectedError, error, 'got an unexpected error'

		it 'should call the cached method with the correct arguments', (done) ->
			callbackCount = 0
			expectedArgs = id: 1, name:'one', created: new Date(), sub: { sub1: 1, sub2: 2}
			methodToCache = (opt, cb) -> callbackCount++; assert.deepEqual(expectedArgs, opt); cb(null)

			cachedMethod = cache.wrap methodToCache, { args: expectedArgs }
			cachedMethod (error, value) -> assert.equal(callbackCount, 1); done()

		it 'should return the cached result, without calling the wrapped method, on the 2nd execution', (done) ->
			expectedCallbackCount = 1
			actualCallbackCount = 0

			methodToCache = (opt, cb) -> cb(null, { count: ++actualCallbackCount }) # inc call count, return it as the cached value
			cachedMethod = cache.wrap(methodToCache)	
			cachedMethod (error, value) -> #first call
				assert.equal(value.count, actualCallbackCount)
				assert.equal(actualCallbackCount, expectedCallbackCount)
				cachedMethod (error, value) -> #second call
					assert.equal(value.count, actualCallbackCount)
					assert.equal(actualCallbackCount, expectedCallbackCount)
					done()

		it 'should return the initialCachedValue without blocking when initialCachedValue is non-null', (done) ->
			callbackCount = 0
			seed = { initial: true }
			methodToCache = (opt, cb) -> cb(null, { initial: opt.initial, count: ++callbackCount })
			cachedMethod = cache.wrap(methodToCache, { initialCachedValue: seed })

			cachedMethod (err, value) ->
				assert.equal(callbackCount, 0, 'expected the cached method not to have been called yet')
				assert.deepEqual(seed, value, 'expected the first returned value to be the initial seed')
				done()

		it 'should allow multiple calls, all of which should block until the initial cache update', (done) ->
			# should allow multiple calls, all of which should block until the initial cache update
			done()

		it 'should not call the cached method more than once at a time before the initial cache update', (done) ->
			# TODO: should not call the cached method more than once at a time
			done()

		it 'should not call the cached method more than once at a time after initial cache update', (done) ->
			# TODO: should not call the cached method more than once at a time
			done()

		it 'should update the cached value after the specified # of minutes', (done) ->
			# methodToCache = (opt, cb) -> cb(null, { initial: opt.initial, count: ++callbackCount })
			# cachedMethod = cache.wrap methodToCache, { expiryMinutes: 0.01 }
			# TODO: should update the cached value after the specified # of minutes
			done()

