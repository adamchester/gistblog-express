
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

		describe '#getPostViewModel()', ->
			beforeEach -> th.mockGithubApis()
			afterEach -> th.cleanUpMockGithubApis()

			it 'should include the shared view model', (done) ->
				s.getPostViewModel 2944558, (model) -> th.assertCallbackSuccess model, undefined, done, ->
					assert model.shared isnt undefined

		describe '#getReadingListViewModel()', ->			
			it 'should make the callback', (done) ->
				s.getReadingListViewModel (model) -> th.assertCallbackSuccess model, undefined, done

			it 'should include the view model items (e.g. shared, items)', (done) -> 
				s.getReadingListViewModel (model) -> th.assertCallbackSuccess model, undefined, done, ->
					assert model.shared isnt undefined
					assert model.items isnt undefined
					assert model.items.length > 0, 'expected items to be an array/list with at least one item'

			it 'should include list in the view model', (done) ->
				s.getReadingListViewModel (model) -> th.assertCallbackSuccess model, undefined, done, ->


		describe '#getSharedViewModel()', ->
			it 'should return an object with [navClasses, sidebarLinks]', ->
				th.assertHasFields s.getSharedViewModel(), expectedSharedViewModelFields


		describe '#getIndexViewModel()', ->
			beforeEach -> th.mockGithubApis()
			afterEach -> th.cleanUpMockGithubApis()

			it 'should execute the callback without error', (done) ->
				s.getIndexViewModel (model) -> th.assertCallbackSuccess model, undefined, done

			it 'should include the shared view model', (done) ->
				s.getIndexViewModel (model) -> th.assertCallbackSuccess model, undefined, done, ->
					assert model.shared isnt undefined



