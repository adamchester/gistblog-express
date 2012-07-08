
nock = require 'nock'
assert = require 'assert'
_ = require 'underscore'

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
	return {
		scopes: githubScopes
		done: () ->
			nock = nock.cleanAll()
			# scope.done() for scope in githubScopes
	}

module.exports.mockGithubApis = mockGithubApis

# some simple assert helpers
module.exports.assertCallbackSuccess = assertCallbackSuccess = (result, error, done, additional) ->
	assert result
	assert !error
	if additional then additional()
	done()


module.exports.assertCallbackResRender = assertCallbackResRender = (routeMethod, expectedTemplateName, done) ->
	req = { params: { id: 1 } }
	res = 
		render: (name, model) ->
			assert name is expectedTemplateName, "expected #{routeMethod} to call res.render with #{expectedTemplateName} as the first param"
			assert model
			done()
	# call the function 
	routeMethod(req, res)

module.exports.assertCallbackError = assertCallbackError = (result, error, done, additional) ->
	# console.log "#{result}, #{error}"
	assert !result
	assert error
	if additional then additional()
	done()


module.exports.assertHasFields = assertHasFields = (object, fields) -> 
	# console.log JSON.stringify(object)
	for field in fields
		fieldValue = object[field]
		assert fieldValue || fieldValue == 0, "expected a field named '#{field}' on: #{JSON.stringify(object)}"
