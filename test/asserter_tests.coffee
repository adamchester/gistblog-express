
# describe how they should work
describe 'asserters', ->

  assert = require 'assert'
  _ = require 'underscore'
  a = require './asserters'

  describe 'verify sample set', ->
    # describe a mock module that 'exports' various things
    myModule =
      export1: {a:'a', b:'b'}
      export2: i:'am', one:'object'
      funcWithNoArgs: (callback) -> callback(null, "with", "some", "extra")
      funcWithOneArg: (input, callback) ->
        assert _.isFunction(callback), "callback must be a function"
        callback(new Error("error") if input is "error")
      funcWithTwoArgs: (input1, input2, callback) ->
        assert _.isFunction(callback), "callback must be a function"
        if input1 is "error" or input2 is "error"
          callback(new Error("error"))
        else 
          callback(null, "with", "some", "extra")

    # describe the assertions that need to be performed
    myAsserts =
      abc: [  ] # abc doesn't exist, but no asserter requires it
      # abc2: [ a.Exists ] # this would fail
      # def: [ new AssertExists() ] # def doesn't exist
      export1: [ a.IsObject, a.HasFields(['a', 'b']) ]
      export2: [ a.IsObject, a.HasFields(['i', 'one']) ]
      funcWithNoArgs: [ a.MustCallback() ]
      funcWithTwoArgs: [ a.MustCallbackError('success', 'error'), a.MustCallback('success', 'success') ]
      funcWithOneArg: [ a.MustCallbackError('error'), a.MustCallback('success') ]

    it 'should get no errors when verified', (done) -> a.verify myAsserts, myModule, done

  asserter = null
  describe 'HasFields', ->
    describe 'given fields [a]', ->
      beforeEach -> asserter = a.HasFields(['a'])
      it 'should not assert when the field exists', (done) -> verifyDoesNotAssert 'exp', asserter, {a:'a'}, done
      it 'should assert when the field does not exist', (done) -> verifyDoesAssert 'exp', asserter, {b:'b'}, done
      it 'should give the correct assertion mesage', (done) ->
        expectedMessage = "expected field 'a' to be defined on export 'exp': {\"b\":\"b\"}"
        verifyAssertionMessage 'exp', asserter, {b:'b'}, expectedMessage, done

  describe 'IsFunction', ->
    beforeEach -> asserter = a.IsFunction
    it 'should not assert with given a function', (done) -> verifyDoesNotAssert 'exp', asserter, (() ->), done
    it 'should assert when given an object', (done) -> verifyDoesAssert 'exp', asserter, {a:'b'}, done
    it 'should give the correct assertion message when given undefined', (done) ->
      expectedMessage = "expected export 'exp' to be defined"
      verifyAssertionMessage 'exp', asserter, undefined, expectedMessage, done

    it 'should give the correct assertion message when given an object literal', (done) ->
      expectedMessage = "expected 'exp' to be a function: ({\"b\":\"b\"})"
      verifyAssertionMessage 'exp', asserter, {b:'b'}, expectedMessage, done

  describe 'IsObject', ->
    beforeEach -> asserter = a.IsObject
    it 'should not assert when given an object literal', (done) -> verifyDoesNotAssert 'exp', asserter, ({}), done
    it 'should not assert when given a function', (done) -> verifyDoesNotAssert 'exp', asserter, (() ->), done

    it 'should assert when given a string', (done) -> verifyDoesAssert 'exp', asserter, 'abc', done
    it 'should assert when given a number', (done) -> verifyDoesAssert 'exp', asserter, 123, done

    it 'should give the correct assertion mesage', (done) ->
      expectedMessage = "expected 'exp' to be an object, instead got: \"abc\""
      verifyAssertionMessage 'exp', asserter, 'abc', expectedMessage, () ->
        expectedMessage = "expected 'exp' to be an object, instead got: 123"
        verifyAssertionMessage 'exp', asserter, 123, expectedMessage, done


  # helper methods to verify asserters
  verifyDoesAssert = (exportName, theAsserter, theInput, done) ->
    executeArgs = {forFieldName: exportName, onObject: theInput}

    # we shouldn't get to the callback as the assert should happen first
    theCodeThatShouldThrow = -> 
      theAsserter.execute executeArgs, -> assert.fail

    assert.throws theCodeThatShouldThrow, assert.AssertionError
    done()

  verifyDoesNotAssert = (exportName, theAsserter, theInput, done) ->
    assert.doesNotThrow ->
      theAsserter.execute {forFieldName: exportName, onObject: theInput}, done

  verifyAssertionMessage = (exportName, theAsserter, theInput, message, done) ->
    try
      theAsserter.execute {forFieldName: exportName, onObject: theInput}, (err) ->
        msg = "the asserter (#{theAsserter.descr}) did not report an error in the callback"
        throw new Error(msg) if not err
    catch error
      if error instanceof assert.AssertionError
        assert.equal error.message, message
        done()
      else
        throw error
