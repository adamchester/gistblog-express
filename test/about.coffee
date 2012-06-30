
assert = require 'assert'
routes = require '../routes/about.js'


describe 'about', ->

	describe 'module', ->
		it 'should export About', -> assert routes.About isnt undefined
		it 'should export About.index', -> assert routes.About.index isnt undefined

	describe 'index', ->
		it 'should call res.render with about template', ->
			req = { }
			res = 
				render: (name, model) ->
					assert name is 'about'
					assert model isnt undefined

			routes.About.index(req, res)

