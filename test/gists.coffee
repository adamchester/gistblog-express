
assert = require 'assert'
gists = require '../lib/gists.js'
nock = require 'nock'


describe 'gists', ->

	describe 'exports', ->
		it 'should export', -> assert gists isnt undefined
		it 'should export getGists', -> assert gists.getGists isnt undefined
		it 'should export getGistMarkdown', -> assert gists.getGistMarkdown isnt undefined
		it 'should not export toViewModel', -> assert gists.toViewModel is undefined

	describe 'methods that get a single gist', ->
		beforeEach -> # 'mock' the http requests
			scope = nock('https://api.github.com/')
				.get('/gists/99999999').reply(401, 'not found')
				.get('/gists/2944558').reply(200, require('./mockGist2944558.json'))

		describe '#getGistMarkdown()', ->
			it 'should return null gist and an error 401 when not found', (done) ->
				gists.getGistMarkdown 99999999, (gist, error) ->
					assert gist is null
					assert error isnt undefined
					assert error is 401
					done()

			it 'should get the markdown for a gist', (done) ->
				gists.getGistMarkdown 2944558, (gist) ->
					assert gist isnt undefined
					assert gist.markdown isnt undefined
					done()

		describe '#getGistHtml()', ->
			it 'should get the html-formatted content for a gist', (done) ->
				gists.getGistHtml 2944558, (gist) ->
					assert gist isnt undefined
					assert gist.html isnt undefined
					done()
			it 'should return null gist and an error 401 when not found', (done) ->
				gists.getGistHtml 99999999, (gist, error) ->
					assert gist is null
					assert error isnt undefined and error is 401
					assert error is 401
					done()

	describe 'methods that list gists', ->
		describe '#getGists()', ->

			beforeEach -> # 'mock' the http requests
				scope = nock('https://api.github.com/')
							.get('/users/invalid/gists')
							.reply(401, 'not found')
							.get('/users/adamchester/gists')
							.reply(200, require('./mockGistList.json'))

			it 'should return null with an error 401 when the user does not exist', (done) ->
				gists.getGists 'invalid', (gistList, error) ->
					assert gistList isnt undefined
					assert gistList is null
					assert error is 401
					done()

			it 'should return a gist list and make the callback', (done) ->
				gists.getGists 'adamchester', (gistList) ->
					# console.log JSON.stringify(gistList)
					assert gistList isnt undefined
					assert gistList.gists isnt undefined
					done()



