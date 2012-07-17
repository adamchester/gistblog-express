describe 'shared', ->

	assert = require 'assert'
	s = require '../lib/shared'
	th = require './test_helpers'
	logging = require '../lib/logging'

	expectedTopLevelPageFields = ['id', 'routePattern', 'name', 'href', 'title', 'pageTemplateName']
	expectedSharedViewModelFields = ['currentTopLevelPage', 'readingListTags', 'topLevelMenuItems', 'pageTemplateName', 'title']
	expectedTopLevelMenuItemFields = ['href', 'text', 'classes']

	# assert helpers
	isFunction = (fn) -> assert th.isFunction(fn)
	assertIsObject = (obj) -> assert th.isObject(obj)
	isNumber = (num) -> assert th.isNumber(num)
	isBool = (bool) -> assert th.isBoolean(bool)
	isAsyncFunction = (fn) -> assert th.isAsyncFunction(fn)
	isConstructor = (fn) -> assert th.isConstructor(fn)
	isViewModel = (obj) -> assert (obj instanceof s.ViewModel)
	hasTopLevelPageFields = (topLevelPages) -> th.assertHasFields(item, expectedTopLevelPageFields) for item in topLevelPages
	hasSharedViewModelFields = (obj) -> th.assertHasFields(item, expectedSharedViewModelFields)
	canCallbackWithValidPostId = (fn, cb) -> fn validPostId1, (err, result) -> th.assertCallbackSuccess result, err, cb
	canCallbackWithNoArgs = (fn, cb) -> fn (err, result) -> th.assertCallbackSuccess result, err, cb
	canCallbackWithValidTagName = (fn, cb) -> fn 'abc', (err, result) -> th.assertCallbackSuccess result, err, cb
	canCallbackWithValidTopLevelPage = (fn, cb) -> fn(s.topLevelPages.index, ((err, result) -> th.assertCallbackSuccess result, err, cb))

	# mock data
	validPostId1 = 2944558
	validPostId2 = 2861047
	invalidPostId = 9999999999

	# set our module expectations
	expectedExports =
		topLevelPages: 				asserts: [assertIsObject, hasTopLevelPageFields]
		isTopLevelPage: 			asserts: [isFunction]
		ViewModel:					asserts: [isConstructor]
		SharedLayoutViewModel:		asserts: [isConstructor]
		getSharedLayoutViewModel: 	asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithValidTopLevelPage]
		getAboutViewModel: 			asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithNoArgs]
		getIndexViewModel: 			asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithNoArgs]
		getPostViewModel: 			asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithValidPostId]
		getTwitterViewModel: 		asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithNoArgs]
		getReadingTagViewModel: 	asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithValidTagName]
		getReadingListViewModel: 	asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithNoArgs]

	# it 'prints', -> th.printExports s

	describe 'exports', ->
		scopes = null
		beforeEach ->
			scopes = th.mockGithubApis [validPostId1, validPostId2], invalidPostId
		afterEach -> scopes.done()

		it 'should have the correct exports', (done) ->
			th.assertValidExports s, expectedExports, () -> done()

