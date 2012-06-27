
assert = require 'assert'
gists = require('../lib/gists.js')

#http = require('http')
# do nothing in our mock request handler
#handleRequest = (req, res) -> return
#createServer = http.createServer handleRequest
	

describe 'gists', ->

	describe 'exports', ->
		it 'should export', -> assert gists isnt undefined
		it 'should export getGists', -> assert gists.getGists isnt undefined
		it 'should export getGistMarkdown', -> assert gists.getGistMarkdown isnt undefined
		it 'should not export toViewModel', -> assert gists.toViewModel is undefined

	describe '#getGistMarkdown()', ->

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

	describe '#getGists()', ->

		it 'should return a gist list and make the callback', (done) ->

			gists.getGists 'adamchester', (gistList) ->
				# console.log gistList
				assert gistList isnt undefined
				assert gistList.gists isnt undefined
				done()



