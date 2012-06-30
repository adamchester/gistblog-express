assert = require 'assert'
gists = require '../lib/gists.js'
nock = require 'nock'

describe 'gists', ->

	describe 'module', ->
		it 'should export', -> assert gists isnt undefined
		it 'should export getGists', -> assert gists.getGists isnt undefined
		it 'should export getGistMarkdown', -> assert gists.getGistMarkdown isnt undefined
		it 'should not export toViewModel', -> assert gists.toViewModel is undefined

	describe 'methods (singular)', ->

		beforeEach -> # mock the possible http requests
			scope = nock('https://api.github.com/')
				.get('/gists/99999999').reply(401, 'not found')
				.get('/gists/2944558').replyWithFile(200, __dirname + '/assets/gists_2944558.json')

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
			it 'should return null gist and an error when not found', (done) ->
				gists.getGistHtml 99999999, (gist, error) ->
					assert gist is null
					assert error isnt undefined
					assert error isnt null
					done()

	describe 'methods (lists)', ->
		describe '#getGists()', ->

			beforeEach -> # mock the possible http requests
				scope = nock('https://api.github.com/')
							.get('/users/invalid/gists')
							.reply(401, 'not found')
							.get('/users/adamchester/gists')
							.replyWithFile(200, __dirname + '/assets/users_adamchester_gists.json')

			it 'should return null with an error when the user does not exist', (done) ->
				gists.getGists 'invalid', (gistList, error) ->
					# assert gistList is null # todo: enable when caching fixed
					assert error isnt null
					done()

			it 'should return a gist list and make the callback', (done) ->
				gists.getGists 'adamchester', (gistList) ->
					assert gistList isnt undefined
					assert gistList.gists isnt undefined
					done()



