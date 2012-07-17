
describe 'reading list', ->

	assert = require 'assert'
	_ = require 'underscore'

	rl = require '../lib/reading_list'
	th = require './test_helpers'
	pkt = require './assets/pocket'

	readingListItemFields = ['title', 'url', 'tags', 'time_added']
	tagFields = ['name', 'href']
	validTagName = 'abc'

	# assert helpers
	isFunction = (fn) -> assert th.isFunction(fn)
	assertIsObject = (obj) -> assert th.isObject(obj)
	isNumber = (num) -> assert th.isNumber(num)
	isBool = (bool) -> assert th.isBoolean(bool)
	isAsyncFunction = (fn) -> assert th.isAsyncFunction(fn)
	isConstructor = (fn) -> assert th.isConstructor(fn)
	isViewModel = (obj) -> assert (obj instanceof s.ViewModel)
	hasTagFields = (obj) -> th.assertHasFields obj, tagFields
	hasTopLevelPageFields = (topLevelPages) -> th.assertHasFields(item, expectedTopLevelPageFields) for item in topLevelPages
	assertHasReadingListFields = (readingListItems) -> th.assertHasFields(item, readingListItemFields) for item in readingListItems

	hasSharedViewModelFields = (obj) -> th.assertHasFields(item, expectedSharedViewModelFields)
	canCallbackWithValidPostId = (fn, cb) -> fn validPostId1, (err, result) -> th.assertCallbackSuccess result, err, cb
	canCallbackWithNoArgs = (fn, cb) -> fn (err, result) -> th.assertCallbackSuccess result, err, cb
	canCallbackWithValidTagName = (fn, cb) -> fn validTagName, (err, result) -> th.assertCallbackSuccess result, err, cb
	canCallbackWithValidTopLevelPage = (fn, cb) -> fn(s.topLevelPages.index, ((err, result) -> th.assertCallbackSuccess result, err, cb))

	resultsHasReadingListFields = (fn, callback) ->
		fn (err, objects) ->
			assert not err, "expected no error but got #{JSON.stringify(err)}"
			assertHasReadingListFields(objects)
			callback()

	returnsObjectsWithTagFields = (getTagsFunction, callback) ->
		getTagsFunction validTagName, (err, tags) ->
			assert not err
			assert hasTagFields(tag) for tag in tags
			callback()

	# not really sure of the wisdom in this
	expectedExports =
		getReadingList:				asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithNoArgs, resultsHasReadingListFields]
		getTags:					asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithNoArgs]
		getTag:						asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithValidTagName]
		getReadingListForTag:		asserts: [isAsyncFunction], asyncAsserts: [canCallbackWithValidTagName]

		toTagItem:					asserts: [isFunction]
		extractTags:				asserts: [isFunction]
		toReadingListItem:		 	asserts: [isFunction]
		toReadingListItems:			asserts: [isFunction]
		getMostRecentlyAddedDate:	asserts: [isFunction]


	it 'should have the correct exports', (done) ->
		th.assertValidExports rl, expectedExports, done

