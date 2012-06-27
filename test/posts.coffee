
assert = require 'assert'
routes = require '../routes/posts.js'

describe 'posts', ->
	describe 'module', ->
		it 'should export Posts', -> assert routes.Posts isnt undefined
		it 'should export Posts.index', -> assert routes.Posts.index isnt undefined

