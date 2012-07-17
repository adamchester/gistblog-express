
nock = require 'nock'
assert = require 'assert'
_ = require 'underscore'
util = require 'util'
async = require 'async'
logging = require '../lib/logging'

# use the nock library to capture requests to the github API
mockGithubApis = (validGistIds, invalidGistId) ->

	if validGistIds is undefined then validGistIds = [2944558, 2861047]
	if invalidGistId is undefined then invalidGistId = 9999999999

	githubApi = new nock('https://api.github.com/')#.log(console.log)
	githubRaw = new nock('https://gist.github.com/')#.log(console.log)

	for validGistsId in validGistIds
		gistJsonPath = __dirname + "/assets/gists_#{validGistsId}.json"
		gistData = require(gistJsonPath);
		githubApi.get("/gists/#{validGistsId}").reply(200, gistData)

		# get the expected raw URL from inside the gist data
		# todo: find a way to filter the raw URLs better?
		rawUrl = gistData.files[_(gistData.files).keys()[0]].raw_url;
		githubRaw.get(rawUrl.replace('https://gist.github.com', '')).replyWithFile(200, __dirname + "/assets/raw_#{validGistsId}.md")

	githubApi.get("/gists/#{invalidGistId}").reply(404, 'not found') if invalidGistId isnt undefined
	githubApi.get('/users/invalid/gists').reply(404, 'not found')
	githubApi.get('/users/adamchester/gists').replyWithFile(200, __dirname + '/assets/users_adamchester_gists.json')

	# return our nock scopes, so the caller call done() if necessary
	githubScopes = [githubApi, githubRaw]
	
	logger = logging.forModule('mockGithubApis')
	logger.info "mocked"
	return {
		scopes: githubScopes
		done: () ->
			nock = nock.cleanAll()
			logger.info "unmocked"
			# scope.done() for scope in githubScopes
	}

module.exports.mockGithubApis = mockGithubApis

module.exports.printExports = printExports = (module) ->
	console.log "expectedExports = \# for #{util.inspect(module, true, 5, true)}"
	console.log "\t#{name}: '#{typeof value}'" for name, value of module


# some simple assert helpers
module.exports.isFunc = (fn) -> _.isFunction(fn)
module.exports.isFunction = (fn) -> _.isFunction(fn)
module.exports.isObject = (obj) -> _.isObject(obj)
module.exports.isNumber = (num) -> _.isNumber(num)
module.exports.isBool = (bool) -> _.isBoolean(bool)
module.exports.isConstructor = (obj) -> _.isFunction(obj) # todo
module.exports.isAsyncFunction = (fn) -> _.isFunction(fn) # todo


# extract names, details, and matching export (if any)
module.exports.ExpectedExport = class ExpectedExport

	constructor: (@name, @details, @fromModule) ->
		@exported = @fromModule[@name] # lookup the exported item by name
		@asserts = @details?.asserts
		@asyncAsserts = @details?.asyncAsserts

	doAsserts: (cb) ->
		assert _.isFunction(cb), "The callback function must be provided"

		# non-async asserts
		asserter(@exported) for asserter in @asserts

		# async asserts
		theExport = @exported # 'this' is not accessible inside the async.forEach
		theAsserts = @asyncAsserts
		return cb() if not theAsserts # just callback right away if not asserts

		async.forEachSeries(
			theAsserts
			(asyncAsserter, afesCallback) -> asyncAsserter(theExport, (err) -> afesCallback(err))
			(err) -> assert(not err, "got error in an asyncAssert for #{@name}: #{JSON.stringify(err)}"); cb()
		)

module.exports.assertValidExports = assertValidExports = (module, expectedNamesAndTypes, done) ->

	logger = logging.forModule('assertValidExports')

	expectedItems = (new ExpectedExport(n,d,module) for n, d of expectedNamesAndTypes)

	doAsserts = (item, cb) ->
		logger.info("checking export #{util.inspect(item.name)}")
		item.doAsserts(()-> cb())

	onFinishedAsserts = (err) -> assert not err; done()

	async.forEachSeries expectedItems, doAsserts, onFinishedAsserts


module.exports.assertCallbackSuccess = assertCallbackSuccess = (result, error, done, additional) ->
	assert result, "the result should be truthy, got #{result} instead"
	assert !error, "the error should be falsy, got #{error} instead"
	if additional then additional()
	done()

module.exports.assertCallbackResRender = assertCallbackResRender = (routeMethod, expectedTemplateName, done) ->
	req = { params: { id: 1 } }
	res = 
		render: (name, model) ->
			assert name is expectedTemplateName, "expected #{routeMethod} to call res.render with #{expectedTemplateName} as the first param"
			assert model, "expected #{routeMethod} to call res.render with a model"
			done()
	# call the function
	assert.doesNotThrow ->
		routeMethod(req, res)

module.exports.assertCallbackError = assertCallbackError = (result, error, done, additional) ->
	# console.log "#{result}, #{error}"
	assert !result, "the result should be falsy, got #{result} instead"
	assert error, "the error should be truthy, got #{error} instead"
	if additional then additional()
	done()

module.exports.assertHasFields = assertHasFields = (object, fields) -> 
	# console.log "assertHasFields for fields #{JSON.stringify(fields)}"
	for field in fields
		fieldValue = object[field]
		# console.log fieldValue
		assert fieldValue?, "expected a field named '#{field}' on: #{JSON.stringify(object)}"
