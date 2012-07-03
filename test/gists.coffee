gists = require '../lib/gists.js'
assert = require 'assert'
nock = require 'nock'
_ = require 'underscore'

# use the nock library to capture requests to the github API
mockGithubApis = (validGistsIds, invalidGistsId) ->
	githubApi = nock('https://api.github.com/') #.log(console.log)
	githubRaw = nock('https://gist.github.com/') #.log(console.log)

	for validGistsId in validGistsIds
		gistJsonPath = __dirname + "/assets/gists_#{validGistsId}.json"
		gistData = require(gistJsonPath);
		githubApi.get("/gists/#{validGistsId}").reply(200, gistData)

		# get the expected raw URL from inside the gist data
		# todo: find a way to filter the raw URLs better?
		rawUrl = gistData.files[_(gistData.files).keys()[0]].raw_url;
		githubRaw.get(rawUrl.replace('https://gist.github.com', '')).replyWithFile(200, __dirname + "/assets/raw_#{validGistsId}.md")

	githubApi.get("/gists/#{invalidGistsId}").reply(404, 'not found') if invalidGistsId isnt undefined
	githubApi.get('/users/invalid/gists').reply(404, 'not found')
	githubApi.get('/users/adamchester/gists').replyWithFile(200, __dirname + '/assets/users_adamchester_gists.json')
	return

# some simple assert helpers
assertCallbackSuccess = (result, error, done, additional) ->
	assert result isnt null
	assert error is undefined
	if additional then additional()
	done()

assertCallbackError = (result, error, done, additional) ->
	# console.log "#{result}, #{error}"
	assert result is null
	assert error isnt null
	if additional then additional()
	done()

assertHasFields = (object, fields) -> 
	# console.log JSON.stringify(object)
	assert(object[field] != null, "expected '#{field}' on: #{JSON.stringify(object)}") for field in fields


describe 'gists', ->

	describe 'module', ->
		it 'should export', -> assert gists isnt undefined
		it 'should export getGistMarkdown', -> assert gists.getGistMarkdown isnt undefined
		it 'should export getGistHtml', -> assert gists.getGistHtml isnt undefined
		it 'should export getBlogPostsForUser', -> assert gists.getBlogPostsForUser isnt undefined
		it 'should export getBlogPost', -> assert gists.getBlogPost isnt undefined
		it 'should not export toBlogPost', -> assert gists.toBlogPost is undefined

	describe 'method', ->
		beforeEach -> mockGithubApis [2944558, 2861047], 99999999
		afterEach -> nock.cleanAll();

		describe '#getGistMarkdown()', ->

			it 'should return null gist and an error 404 when not found', (done) ->
				gists.getGistMarkdown 99999999, (gist, error) ->
					assertCallbackError gist, error, done

			it 'should get the markdown for a gist', (done) ->
				gists.getGistMarkdown 2944558, (gist) ->
					assertCallbackSuccess gist, undefined, done, ->
						gist.markdown isnt undefined

		describe '#getGistHtml()', ->
			it 'should get the html-formatted content for a gist', (done) ->
				gists.getGistHtml 2944558, (markdown, html) ->
					result = { m: markdown, h: html}
					assertCallbackSuccess result, undefined, done, ->
						assert result.m
						assert result.h

			it 'should return null gist and an error when not found', (done) -> 
				gists.getGistHtml 99999999, (markdown, html, error) ->
					result = null
					assertCallbackError result, error, done, ->
						assert not markdown
						assert not html

		describe '#getBlogPostsForUser()', ->

			it 'should return objects with fields: [id, title, date, content_md, content_html, comment_count]', (done) ->
				gists.getBlogPostsForUser {username: 'adamchester', allContents: true}, (posts, error) ->
					assertCallbackSuccess posts, error, done, ->
						assertHasFields(post, ["id", "title", "date", "content_md", "content_html", "comment_count"]) for post in posts

			it 'should return null with an error when the user does not exist', (done) ->
				gists.getBlogPostsForUser {username: 'invalid'}, (posts, error) -> 
					assertCallbackError posts, error, done

		describe '#getBlogPost()', ->

			it 'should return the post with fields: [id, title, date, content_md, content_html, comment_count]', (done) ->
				gists.getBlogPost 2944558, (post, error) -> 
					assertCallbackSuccess post, error, done, ->
						assertHasFields(post, ["id", "title", "date", "content_md", "content_html", "comment_count"])

			it 'should return null with an error when the post does not exist', (done) ->
				gists.getBlogPost 99999999, (post, error) -> 
					assertCallbackError post, error, done



