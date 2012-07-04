
assert = require 'assert'
th = require './test_helpers'

routes = 
	About: require('../routes/about').About
	Reading: require('../routes/reading').Reading
	Posts: require('../routes/posts').Posts

describe 'routes', ->

	describe 'About', ->
		it 'should export About', -> assert routes.About isnt undefined
		it 'should export About.index', -> 	assert routes.About.index isnt undefined

		describe '#About.index()', ->
			it 'should call res.render with about template', (done) ->
				th.assertCallbackResRender routes.About.index, 'about', done

	describe 'Reading', ->
		it 'should export Reading', -> assert routes.Reading isnt undefined
		it 'should export Reading.index', -> assert routes.Reading.index isnt undefined

		describe '#Reading.index', ->
			it 'should call res.render with reading template', (done) ->
				th.assertCallbackResRender routes.Reading.index, 'reading', done

	describe 'Posts', ->
		it 'should export Posts', -> assert routes.Posts isnt undefined
		it 'should export Posts.index', -> assert routes.Posts.index isnt undefined
		it 'should export Posts.post', -> assert routes.Posts.post isnt undefined
		it 'should export Posts.twitter', -> assert routes.Posts.twitter isnt undefined

		describe '#Posts.index', ->
			it 'should call res.render with reading template', (done) ->
				th.assertCallbackResRender routes.Posts.index, 'index', done

		# todo: harder to mock this stuff
		# describe '#Posts.post', ->
		# 	it 'should call res.render with post template', (done) ->
		# 		th.assertCallbackResRender routes.Posts.post, 'post', done

		describe '#Posts.twitter', ->
			it 'should call res.render with twitter template', (done) ->
				th.assertCallbackResRender routes.Posts.twitter, 'twitter', done

