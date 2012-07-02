gists = require '../lib/gists.js'
assert = require 'assert'
nock = require 'nock'

# use the nock library to capture requests to the github API
mockGithubApiScope = (validGistsIds, invalidGistsId) ->
	mock = nock('https://api.github.com/')

	for validGistsId in validGistsIds
		if validGistsId isnt undefined
			mock.get("/gists/#{validGistsId}").replyWithFile(200, __dirname + "/assets/gists_#{validGistsId}.json") 

	mock.get("/gists/#{invalidGistsId}").reply(404, 'not found') if invalidGistsId isnt undefined
	mock.get('/users/invalid/gists').reply(404, 'not found')
	mock.get('/users/adamchester/gists').replyWithFile(200, __dirname + '/assets/users_adamchester_gists.json')
	mock

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

	beforeEach -> scope = mockGithubApiScope [2944558, 2861047], 99999999
 
	describe 'module', ->
		it 'should export', -> assert gists isnt undefined
		it 'should export getGistMarkdown', -> assert gists.getGistMarkdown isnt undefined
		it 'should export getGistHtml', -> assert gists.getGistHtml isnt undefined
		it 'should export getBlogPosts', -> assert gists.getBlogPosts isnt undefined
		it 'should export getAllBlogPostsContent', -> assert gists.getAllBlogPostsContent isnt undefined
		it 'should not export toBlogPost', -> assert gists.toBlogPost is undefined

	describe 'methods (gists)', ->

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

	describe 'methods (blog posts)', ->

		describe '#getAllBlogPostsContent()', ->

			it 'should return objects with fields: [id, title, date, content_md, content_html]', (done) ->
				gists.getAllBlogPostsContent 'adamchester', (posts, error) ->
					assertCallbackSuccess posts, error, done, ->
						assertHasFields(post, ["id", "title", "date", "content_md", "content_html"]) for post in posts

		describe '#getBlogPosts()', ->

			it 'should return null with an error when the user does not exist', (done) ->
				gists.getBlogPosts 'invalid', (gistList, error) -> 
					assertCallbackError gistList, error, done

			it 'should return a gist list and make the callback', (done) ->
				gists.getBlogPosts 'adamchester', (gistList) -> 
					assertCallbackSuccess gistList, undefined, done

