
describe 'routes/', ->
	
	assert = require 'assert'
	th = require './test_helpers'

	isFunction = th.isFunction

	expectedRouteMap =
		about: ['/about']
		global: ['/403', '/404', '/500']
		posts: ['/', '/posts/:id', '/twitter']
		reading: ['/reading', '/reading/tags/:tagName']

	it 'should map the correct routes', ->

		[actualRoutes, currentModuleName] = [{}, '']

		# mock 'app' object so it progressively builds actualRoutes
		app = get: (routePattern) ->
			actualRoutes[currentModuleName] ?= []
			actualRoutes[currentModuleName].push(routePattern)

		# put the routes for each module into our local routes object
		buildRoutes = (forModuleName) ->
			currentModuleName = forModuleName
			routeModuleInitialiser = require("../routes/#{forModuleName}")
			assert isFunction(routeModuleInitialiser), "expected the route module #{forModuleName} to return a function"
			routeModuleInitialiser(app)

		buildRoutes(name) for name, routes of expectedRouteMap

		assert.deepEqual actualRoutes, expectedRouteMap
