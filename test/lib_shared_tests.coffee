
assert = require 'assert'
s = require '../lib/shared'
th = require './test_helpers'

describe 'shared', ->
	describe 'module', ->
		it 'should export getSharedViewModel', -> assert s.getSharedViewModel isnt undefined
		it 'should export getIndexViewModel', -> assert s.getIndexViewModel isnt undefined
		it 'should export getReadingListViewModel', -> assert s.getReadingListViewModel isnt undefined

	describe 'method', ->

		describe '#getReadingListViewModel()', ->
			it 'should include the shared view model', (done) -> 
				s.getReadingListViewModel {}, (model) -> th.assertCallbackSuccess model, undefined, done, ->
					assert model.shared isnt undefined

			it 'should make the callback', (done) ->
				s.getReadingListViewModel { params: { id: 0 } }, (model) -> th.assertCallbackSuccess model, undefined, done

		describe '#getSharedViewModel()', ->
			it 'should return an object with [navClasses, sidebarLinks]', ->
				th.assertHasFields s.getSharedViewModel(), ['navClasses', 'sidebarLinks']

		describe '#getIndexViewModel()', ->
			beforeEach -> th.mockGithubApis()
			afterEach -> th.cleanUpMockGithubApis()

			it 'should execute the callback without error', (done) ->
				s.getIndexViewModel (model) -> th.assertCallbackSuccess model, undefined, done

			it 'should include the shared view model', (done) ->
				s.getIndexViewModel (model) -> th.assertCallbackSuccess model, undefined, done, ->
					assert model.shared isnt undefined



