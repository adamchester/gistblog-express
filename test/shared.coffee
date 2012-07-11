describe 'shared', ->

	assert = require 'assert'
	s = require '../lib/shared'
	th = require './test_helpers'

	# helpers
	isFunction = (fn) -> th.isFunction(fn)
	isObject = (obj) -> th.isObject(obj)
	isNumber = (num) -> th.isNumber(num)
	isBool = (bool) -> th.isBoolean(bool)

	assertSharedViewModel = (viewModel) ->
		th.assertHasFields viewModel, expectedSharedViewModelFields
		th.assertHasFields item, expectedTopLevelMenuItemFields for item in viewModel.topLevelMenuItems

	expectedSharedViewModelFields = ['currentTopLevelPage', 'readingListTags', 'topLevelMenuItems', 'pageTemplateName', 'title']
	expectedTopLevelMenuItemFields = ['href', 'text', 'classes']
	validPostId1 = 2944558
	validPostId2 = 2861047
	invalidPostId = 9999999999

	describe 'module', ->
		it 'should export getSharedViewModel', -> assert isFunction(s.getSharedViewModel)
		it 'should export getIndexViewModel', -> assert isFunction(s.getIndexViewModel)
		it 'should export getReadingListViewModel', -> assert isFunction(s.getReadingListViewModel)
		it 'should export getPostViewModel', -> assert isFunction(s.getPostViewModel)
		it 'should export getTwitterViewModel', -> assert isFunction(s.getTwitterViewModel)

	describe 'method', ->

		githubApiScopes = null
		beforeEach -> githubApiScopes = th.mockGithubApis([validPostId1, validPostId2], invalidPostId)
		afterEach -> githubApiScopes.done()

		describe '#getPostViewModel()', ->

			it 'should include the shared view model', (done) ->
				s.getPostViewModel validPostId1, (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assertSharedViewModel model

			it 'should work with a string postId', (done) ->
				s.getPostViewModel "#{validPostId1}", (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assert model.item isnt null

		describe '#getReadingListViewModel()', ->			
			it 'should make the callback', (done) ->
				s.getReadingListViewModel (err, model) -> th.assertCallbackSuccess model, err, done

			it 'should include the view model items (e.g. shared, items)', (done) -> 
				s.getReadingListViewModel (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assertSharedViewModel model
					assert model.items isnt undefined
					assert model.items.length > 0, 'expected items to be an array/list with at least one item'

		describe '#getSharedViewModel()', ->
			it 'should return an object with [navClasses, sidebarLinks]', (done) ->
				s.getSharedViewModel s.topLevelPages.index, (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assertSharedViewModel model

		describe '#getIndexViewModel()', ->

			it 'should execute the callback without error', (done) ->
				s.getIndexViewModel (err, model) -> th.assertCallbackSuccess model, err, done

			it 'should include the shared view model', (done) ->
				s.getIndexViewModel (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assertSharedViewModel model



