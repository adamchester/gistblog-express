describe 'shared', ->

	assert = require 'assert'
	s = require '../lib/shared'
	th = require './test_helpers'

	# helpers
	isFunction = (fn) -> th.isFunction(fn)
	isObject = (obj) -> th.isObject(obj)
	isNumber = (num) -> th.isNumber(num)
	isBool = (bool) -> th.isBoolean(bool)

	assertIsViewModel = (viewModel) ->
		assert (viewModel instanceof s.ViewModel)

	validPostId1 = 2944558
	validPostId2 = 2861047
	invalidPostId = 9999999999

	describe 'module', ->

		it 'should export topLevelPages', -> assert.ok s.topLevelPages
		it 'should export ViewModel', -> assert.ok s.ViewModel
		it 'should export SharedViewModel', -> assert.ok s.SharedViewModel
		it 'should export getAboutViewModel', -> assert isFunction(s.getAboutViewModel)
		it 'should export getSharedViewModel', -> assert isFunction(s.getSharedViewModel)
		it 'should export getIndexViewModel', -> assert isFunction(s.getIndexViewModel)
		it 'should export getReadingListViewModel', -> assert isFunction(s.getReadingListViewModel)
		it 'should export getReadingTagViewModel', -> assert isFunction(s.getReadingTagViewModel)
		it 'should export getPostViewModel', -> assert isFunction(s.getPostViewModel)
		it 'should export getTwitterViewModel', -> assert isFunction(s.getTwitterViewModel)

	describe 'method', ->

		githubApiScopes = null
		beforeEach -> githubApiScopes = th.mockGithubApis([validPostId1, validPostId2], invalidPostId)
		afterEach -> githubApiScopes.done()

		describe '#getPostViewModel()', ->

			it 'should return a ViewModel with expected fields', (done) ->
				s.getPostViewModel validPostId1, (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assertIsViewModel model

			it 'should work with a string postId', (done) ->
				s.getPostViewModel "#{validPostId1}", (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assert model.item isnt null

		describe '#getReadingListViewModel()', ->
	
			it 'should return a ViewModel with expected fields', (done) ->
				s.getReadingListViewModel (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assertIsViewModel model
					assert model.items isnt undefined
					assert model.items.length > 0, 'expected items to be an array/list with at least one item'

		describe '#getSharedViewModel()', ->

			it 'should return a ViewModel with expected fields', (done) ->

				expectedSharedViewModelFields = ['currentTopLevelPage', 'readingListTags', 'topLevelMenuItems', 'pageTemplateName', 'title']
				expectedTopLevelMenuItemFields = ['href', 'text', 'classes']

				s.getSharedViewModel s.topLevelPages.index, (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assertIsViewModel model
					th.assertHasFields model, expectedSharedViewModelFields
					th.assertHasFields item, expectedTopLevelMenuItemFields for item in model.topLevelMenuItems

		describe '#getIndexViewModel()', ->

			it 'should return a ViewModel with expected fields', (done) ->
				s.getIndexViewModel (err, model) -> th.assertCallbackSuccess model, err, done, ->
					assertIsViewModel model
					th.assertHasFields model, ['posts']



