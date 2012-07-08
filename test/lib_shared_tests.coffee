describe 'shared', ->

	assert = require 'assert'
	s = require '../lib/shared'
	th = require './test_helpers'

	expectedSharedViewModelFields = ['topLevelMenuItems']
	expectedTopLevelMenuItemFields = ['href', 'text', 'classes']
	validPostId1 = 2944558
	validPostId2 = 2861047
	invalidPostId = 9999999999

	describe 'module', ->
		it 'should export getSharedViewModel', -> assert s.getSharedViewModel isnt undefined
		it 'should export getIndexViewModel', -> assert s.getIndexViewModel isnt undefined
		it 'should export getReadingListViewModel', -> assert s.getReadingListViewModel isnt undefined
		it 'should export getPostViewModel', -> assert s.getPostViewModel isnt undefined

	describe 'method', ->

		githubApiScopes = null
		beforeEach -> githubApiScopes = th.mockGithubApis([validPostId1, validPostId2], invalidPostId)
		afterEach -> githubApiScopes.done()

		describe '#getPostViewModel()', ->

			it 'should include the shared view model', (done) ->
				s.getPostViewModel validPostId1, (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assert model.shared isnt undefined

			it 'should work with a string postId', (done) ->
				s.getPostViewModel "#{validPostId1}", (err, model) -> th.assertCallbackSuccess model, err, done, ->
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
				model = s.getSharedViewModel()
				th.assertHasFields model, expectedSharedViewModelFields
				th.assertHasFields item, expectedTopLevelMenuItemFields for item in model.topLevelMenuItems

		describe '#getIndexViewModel()', ->

			it 'should execute the callback without error', (done) ->
				s.getIndexViewModel (err, model) -> th.assertCallbackSuccess model, err, done

			it 'should include the shared view model', (done) ->
				s.getIndexViewModel (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assert model.shared isnt undefined



