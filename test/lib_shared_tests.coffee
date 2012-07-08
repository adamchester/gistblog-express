
assert = require 'assert'
s = require '../lib/shared'
th = require './test_helpers'

expectedSharedViewModelFields = ['navClasses', 'sidebarLinks']

describe 'shared', ->
	describe 'module', ->
		it 'should export getSharedViewModel', -> assert s.getSharedViewModel isnt undefined
		it 'should export getIndexViewModel', -> assert s.getIndexViewModel isnt undefined
		it 'should export getReadingListViewModel', -> assert s.getReadingListViewModel isnt undefined
		it 'should export getPostViewModel', -> assert s.getPostViewModel isnt undefined

	describe 'method', ->

		githubApiScopes = null
		beforeEach -> githubApiScopes = th.mockGithubApis([2944558, 2861047], 9999999999)
		afterEach -> githubApiScopes.done()

		describe '#getPostViewModel()', ->

			it 'should include the shared view model', (done) ->
				s.getPostViewModel 2944558, (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assert model.shared isnt undefined

			it 'should work with a string postId', (done) ->
				s.getPostViewModel "2944558", (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assert model.shared isnt undefined and model.shared isnt null
					assert model.item isnt null

		describe '#getReadingListViewModel()', ->			
			it 'should make the callback', (done) ->
				s.getReadingListViewModel (err, model) -> th.assertCallbackSuccess model, err, done

			it 'should include the view model items (e.g. shared, items)', (done) -> 
				s.getReadingListViewModel (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assert model.shared isnt undefined
					assert model.items isnt undefined
					assert model.items.length > 0, 'expected items to be an array/list with at least one item'

			it 'should include list in the view model', (done) ->
				s.getReadingListViewModel (err, model) -> th.assertCallbackSuccess model, err, done, ->

		describe '#getSharedViewModel()', ->
			it 'should return an object with [navClasses, sidebarLinks]', ->
				th.assertHasFields s.getSharedViewModel(), expectedSharedViewModelFields

		describe '#getIndexViewModel()', ->

			it 'should execute the callback without error', (done) ->
				s.getIndexViewModel (err, model) -> th.assertCallbackSuccess model, err, done

			it 'should include the shared view model', (done) ->
				s.getIndexViewModel (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assert model.shared isnt undefined



