
assert = require 'assert'
_ = require 'underscore'
util = require 'util'
async = require 'async'

###*
 * The escape character.
 * @type {String}
###
esc = '\u001b['

###*
 * The colours used to print to the console.
 * @type {Object}
###
colours =
	reset: esc + '0m'
	green: esc + '32m'
	red: esc + '31m'
	blue: esc + '34m'

###*
 * Wraps the given text with a specified colour (col)
 * @param  {String} text       The text to be colorised
 * @param  {Object} colourName The name of the color (e.g. 'red', 'green')
 * @return {String}            The text, wrapped in the colour code
###
cw = (text, colourName) -> "#{colours[colourName]}#{text}#{colours.reset}"

###*
 * Provides functions (one for each color) which wrap text in the specified.
 * @type {Object}
###
col =
	red: (str) -> cw(str, 'red')
	green: (str) -> cw(str, 'green')
	blue: (str) -> cw(str, 'blue')

###*
 * Convert an object to a string suitable for logging/debugging
 * @param  {[]} obj [description]
 * @return {[type]}     [description]
###
dump = (obj) ->
	if obj instanceof Function
		util.inspect(obj, true, 1, true)
			.replace(/(\r\n|\n|\r)/gm, " ") # remove newlines
			.replace(/\s+/g," "); # remove consecutive spaces
	else JSON.stringify(obj)


###*
 * The base class for all assertions. Override @assertObj (or @execute if you
 * to use the the callback) and optionally @toString.
###
class Asserter
	constructor: () ->
		@descr = this.constructor.name

	execute: (options, cb) ->
		assert(_.isFunction(cb), "expected cb to be a function") if cb? 
		@assertObj options
		cb(null) if cb # callback

	assertObj: (options) ->
		# note: options.onObject may be undefined (i.e. export is missing)
		assert options.forFieldName?, "missing forFieldName"
		return true

	toString: (options) ->
		# bestStringRep = if _.isFunction(obj) then Asserter.funcToString(obj) else JSON.stringify(obj)
		"#{col.green(@descr)} for '#{options.forFieldName}'"

	###*
	 * ensures a given object is an instance of Asserter, throwing a decent error if it is not.
	 * @param  {Object} candidate Any object, which may be an Asserter instance 
	###
	@ensureIsAsserter: (candidate) ->
		# console.log (candidate instanceof Asserter)
		if not (candidate instanceof Asserter)
			sample = "{ fieldName: [ a.NoArgs, a.WithArgs('a','b') ] }"
			msg = util.format('Expected an instance of Asserter. Assertions should look like this: %s\nDid you you forget () ?\nInstead of an Asserter instance, we found: %s', sample, dump(candidate))
			throw new Error(msg)

	###*
	 * Executes an Asserter with the provided options.
	 * @param  {Asserter}   asserter The asserter instance
	 * @param  {Object}   options  The options to pass to the Asserter, e.g. { forFieldName: 'abc', onObject: myObject }
	 * @param  {Function} callback The callback that is called when the assertion completes succesfully
	###
	@verify: (asserter, options, callback) ->
		if not _.isFunction(callback) then throw new Error('the callback must be a function')
		Asserter.ensureIsAsserter asserter
		console.log asserter.toString(options)
		asserter.execute options, (err) -> callback(err)

	###*
	 * Verify a list of assertions.
	 * @param  {Object}   assertions An object in the format { field1: [ Asserter instances...], field2: [Asserter instances...] }
	 * @param  {Function} callback   The function that is called when the assertions complete successfully
	###
	@verifyAll: (assertions, target, callback) ->
		verifiableFields = ({ onObject: (target[n]), forFieldName: n, asserters: a} for n, a of assertions)

		async.forEachSeries verifiableFields,
			(field, forFieldNameDoneCallback) ->
				async.forEachSeries field.asserters,
					(asserter, asserterDoneCallback) ->		
						# use do + nextTick for a nicer stacktrance
						do (asserter) ->
							async.nextTick () ->
								Asserter.verify asserter, field, asserterDoneCallback
					(error) -> forFieldNameDoneCallback(error) # when all assertions for this field are done
			(error) -> callback(error) # when all module exports are done



class AssertExists extends Asserter
	constructor: () -> super()
	assertObj: (options) ->
		super(options)
		assert options.onObject != undefined, "expected export '#{options.forFieldName}' to be defined"



class AssertIsFunction extends AssertExists
	constructor: () -> super()
	assertObj: (options) ->
		super(options)
		assert _.isFunction(options.onObject), "expected '#{options.forFieldName}' to be a function: (#{dump(options.onObject)})"


class AssertReturnValueEquals extends AssertIsFunction
	constructor: (@expectedResult, @fnArgs) -> super()
	toString: (options) -> if @expectedResult then "#{super(options)} (expects: #{dump(@expectedResult)}" else super(obj)
	assertObj: (options) ->
		super(options)
		fn = options.onObject
		assert _.isFunction(fn), "expected #{options.forFieldName} to be a function"
		# call the function
		fnApplyArgs = if @fnArgs? then @fnArgs else undefined
		actualResult = fn.apply({}, fnApplyArgs)
		assert.deepEqual @expectedResult, actualResult


class AssertMustCallbackBase extends AssertIsFunction
	constructor: (@withArgs) -> super()
	toString: (options) -> 
		hasArgs = @withArgs? and @withArgs.length > 0
		if hasArgs then "#{super(options)} (args = #{dump(@withArgs)})" else super(options)

	executeAssertOnCallback: (options, cb) ->
		methodToExecute = options.onObject

		methodToExecuteCb = (error, results...) ->
			forEachItems = (item for item in results)
			cb.apply(this, [error].concat(results))

		# call the method
		argsAndCallback = _.flatten( [ @withArgs, (methodToExecuteCb) ] )
		methodToExecute.apply(null, argsAndCallback)



class AssertMustCallback extends AssertMustCallbackBase
	constructor: (argsArray) -> super(argsArray)
	execute: (options, cb) ->
		@executeAssertOnCallback options, (error, results...) ->
			assert not error, "expected method #{options.forFieldName} to callback with no error, but got #{dump(error)}"
			cb.apply(this, [error].concat(results))



class AssertMustCallbackError extends AssertMustCallbackBase
	constructor: (argsArray) -> super(argsArray)
	execute: (options, cb) ->
		@executeAssertOnCallback options, (error, results...) ->
			assert error, "expected method #{options.forFieldName} to callback with an error, but didn't get one"
			cb.apply(this) # don't pass on the error



class AssertIsObject extends AssertExists
	constructor: () -> super()
	assertObj: (options) ->
		super(options) # check base classes logic first
		assert _.isObject(options.onObject), "expected '#{options.forFieldName}' to be an object, instead got: #{dump(options.onObject)}"



class AssertHasFields extends AssertExists
	constructor: (@fields) -> super()
	toString: (options) ->
		if @fields and @fields.length > 0 then "#{super(options)} (fields = #{dump(@fields)})"
		else super(options)

	assertObj: (options) ->
		[obj, forFieldName] = [options.onObject, options.forFieldName]
		super(options) # check base classes logic first
		for field in @fields
			assert obj[field]?, "expected field '#{field}' to be defined on export '#{forFieldName}': #{dump(obj)}"



class AssertHasFieldsForEach extends AssertExists
	constructor: (@fields, @iterator = (obj) -> item for item in obj) -> super()
	execute: (options, cb) ->
		[forFieldName, onObject] = [options.forFieldName, options.onObject]
		@assertObj options # check base classes logic first

		forEachItems = if @iterator? then @iterator(onObject) else onObject
		assert isNonEmptyArrayLike(forEachItems), "expected export '#{forFieldName}' to be non-empty, enumerable list of things"

		do (fields = @fields, subFieldName = forFieldName) ->
			async.forEachSeries forEachItems,
				(item, eachObjCallback) ->
					asserter = new AssertHasFields(fields)
					executeOptions = { forFieldName: subFieldName, onObject: item }
					asserter.execute executeOptions, eachObjCallback
				(error) ->
					cb(error)



class AssertMustCallbackWithFieldsForEach extends AssertMustCallbackBase
	constructor: (@fields, args) -> super(args)
	toString: (options) -> if @fields? then "#{super(options)} (fields = #{dump(@fields)})" else super(options) # todo
	execute: (options, cb) ->
		self = @
		do (flds = @fields) ->
			self.executeAssertOnCallback options, (error, result) ->
				hasFieldsOptions = { onObject: result, forFieldName: options.forFieldName }
				Asserter.verify new AssertHasFieldsForEach(flds), hasFieldsOptions, cb



class AssertMustCallbackWithFields extends AssertMustCallbackBase
	constructor: (@fields, args) -> super(args)
	toString: (options) -> if @fields? then "#{super(options)} (fields = #{dump(@fields)})" else super(options) # todo
	execute: (options, cb) ->
		self = @
		do (flds = @fields) ->
			self.executeAssertOnCallback options, (error, result) ->
				hasFieldsOptions = { onObject: result, forFieldName: options.forFieldName }
				Asserter.verify new AssertHasFields(flds), hasFieldsOptions, cb



class AssertReturnsFields extends AssertIsFunction
	constructor: (@fields, @fnArgs) -> super()
	toString: (options) -> if @fields? then "#{super(options)} (args = #{dump(@fnArgs)}) (expectFields = #{dump(@fields)})" else super(options)
	execute: (options, cb) ->
		@assertObj options # check base classes logic first
		theField = options.forFieldName

		# call the function, get the returned result
		fnResult = options.onObject.apply({}, @fnArgs) # in case it's a constructor, 
		assert fnResult, "expected '#{theField}' to return something, but got: #{dump(fnResult)}"

		# pass off to AssertHasFields to do the work
		hasFieldsOptions = { onObject: fnResult, forFieldName: theField }
		Asserter.verify new AssertHasFields(@fields), hasFieldsOptions, cb


# see http://stackoverflow.com/questions/1058427/how-to-detect-if-a-variable-is-an-array
isNonEmptyArrayLike = (obj) ->
	try # don't bother with `typeof` - just access `length` and `catch`
		(obj.length > 0) and ('0' of Object(obj))
	catch e
		false


# put some syntax sugar on it
module.exports = a =
	Asserter: () -> Asserter # export the base class
	dump: (obj) -> dump(obj) # helper to stringify an object
	
	# Assertions
	Exists: new AssertExists()
	IsFunction: new AssertIsFunction()
	IsObject: new AssertIsObject()

	HasFields: (fields) -> new AssertHasFields(fields)
	HasFieldsForEach: (fields) -> new AssertHasFieldsForEach(fields) # todo
	HasFieldsOfEach: (fields) ->
		console.log 'HasFieldsOfEach'
		new AssertHasFieldsForEach(fields, (obj) -> (obj[prop] for prop of obj))

	ReturnValueEquals: (expected, fnArgs...) -> new AssertReturnValueEquals(expected, fnArgs)
	ReturnsFields: (fields, fnArgs...) -> new AssertReturnsFields(fields, fnArgs)
	ReturnsFieldsForEach: (fields) -> new AssertReturnsFieldsForEach(fields)
	ReturnsFieldsOfEach: (fields) -> new AssertReturnsFieldsForEach(fields, (obj) -> (obj[prop] for prop of obj))

	MustCallback: () -> new AssertMustCallback(_.toArray(arguments))
	MustCallbackError: () -> new AssertMustCallbackError(_.toArray(arguments))

	MustCallbackWithFields: (fields, fnArgs...) -> new AssertMustCallbackWithFields(fields, fnArgs)
	MustCallbackWithFieldsForEach: (fields, fnArgs...) -> new AssertMustCallbackWithFieldsForEach(fields, fnArgs)

	verify: (assertions, moduleOrRequirePath, done) ->
		isRequirePath = typeof moduleOrRequirePath == 'string'
		module = if isRequirePath then require(moduleOrRequirePath) else moduleOrRequirePath
		Asserter.verifyAll assertions, module, done

