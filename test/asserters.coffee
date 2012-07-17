
assert = require 'assert'
_ = require 'underscore'
util = require 'util'

# define some classes
module.exports.Asserter = class Asserter
	constructor: (@descr = this.constructor.name) -> # console.log @descr
	doAssert: (onObject, cb) ->
		@assertObj onObject
		cb(null) if cb # callback

	assertObj: (obj) -> # derived class overrides

module.exports.AssertIsDefined = class AssertIsDefined extends Asserter
	constructor: () -> super()
	assertObj: (obj) ->
		super(obj)
		assert obj != undefined, "expected object to be defined"

module.exports.AssertIsFunction = class AssertIsFunction extends AssertIsDefined
	constructor: () -> super()
	assertObj: (obj) ->
		super(obj)
		assert _.isFunction(obj), "expected #{JSON.stringify(obj)} to be a function"

module.exports.AssertIsObject = class AssertIsObject extends AssertIsDefined
	constructor: () -> super()
	assertObj: (obj) ->
		super(obj)
		assert _.isObject(obj), "expected #{JSON.stringify(obj)} to be an object"

module.exports.AssertHasFields = class AssertHasFields extends AssertIsDefined
	constructor: (@fields) -> super()
	assertObj: (obj) ->
		super(obj) # check base classes logic first
		for field in @fields
			assert obj[field]?, "expected field '#{field}' to be defined on object: #{JSON.stringify(obj)}"
		return true

# describe how they should work
describe 'asserter (class experiment)', ->
	asserter = null # assign in beforeEach

	describe 'AssertHasFields', ->
		beforeEach -> asserter = new AssertHasFields(['a'])
		it 'should not assert when the field exists', (done) -> verifyDoesNotAssert asserter, {a:'a'}, done
		it 'should assert when the field does not exist', (done) -> verifyDoesAssert asserter, {b:'b'}, done
		
		it 'should give the correct assertion mesage', (done) ->
			expectedMessage = "expected field 'a' to be defined on object: {\"b\":\"b\"}"
			verifyAssertionMessage asserter, {b:'b'}, expectedMessage, done

	describe 'AssertIsFunction', ->
		beforeEach -> asserter = new AssertIsFunction()
		it 'should not assert with given a function', (done) -> verifyDoesNotAssert asserter, (() ->), done
		it 'should assert when given an object', (done) -> verifyDoesAssert asserter, {a:'b'}, done
		
		it 'should give the correct assertion message when given undefined', (done) ->
			expectedMessage = "expected object to be defined"
			verifyAssertionMessage asserter, undefined, expectedMessage, done

		it 'should give the correct assertion message when given an object literal', (done) ->
			expectedMessage = "expected {\"b\":\"b\"} to be a function"
			verifyAssertionMessage asserter, {b:'b'}, expectedMessage, done

	describe 'AssertIsObject', ->
		beforeEach -> asserter = new AssertIsObject()
		it 'should not assert when given an object literal', (done) -> verifyDoesNotAssert asserter, ({}), done
		it 'should not assert when given a function', (done) -> verifyDoesNotAssert asserter, (() ->), done
		
		it 'should assert when given a string', (done) -> verifyDoesAssert asserter, 'abc', done
		it 'should assert when given a number', (done) -> verifyDoesAssert asserter, 123, done
		
		it 'should give the correct assertion mesage', (done) ->
			expectedMessage = "expected \"abc\" to be an object"
			verifyAssertionMessage asserter, 'abc', expectedMessage, () ->
				expectedMessage = "expected 123 to be an object"
				verifyAssertionMessage asserter, 123, expectedMessage, done


# helper methods to verify asserters
verifyDoesAssert = (theAsserter, theInput, done) ->
	#console.log "asserting #{theAsserter} throws..."
	assert.throws (-> theAsserter.doAssert(theInput, ( -> assert.fail))), assert.AssertionError
	#console.log "finished asserting"
	done()

verifyDoesNotAssert = (theAsserter, theInput, done) ->
	# console.log "asserting #{JSON.stringify(theAsserter)} does NOT throw with #{JSON.stringify(theInput)}..."
	assert.doesNotThrow -> theAsserter.doAssert(theInput, done)
	#console.log "finished asserting"

verifyAssertionMessage = (theAsserter, theInput, message, done) ->
	try
	  theAsserter.doAssert theInput, (err) ->
	  	throw new Error("the asserter (#{theAsserter.descr}) did not report an error in the callback") if not err
	catch error
		if error instanceof assert.AssertionError
			assert.equal error.message, message
			done()
		else
			throw error


