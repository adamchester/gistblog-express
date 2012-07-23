describe 'shared', ->

	assert = require 'assert'
	s = require '../lib/shared'
	th = require './test_helpers'
	logging = require '../lib/logging'
	a = require './asserters'

	baseViewModelFields = ['title', 'pageTemplateName', 'topLevelPage']
	topLevelPageFields = ['id', 'routePattern', 'name', 'href', 'title', 'pageTemplateName']
	sharedViewModelFields = ['currentTopLevelPage', 'readingListTags', 'topLevelMenuItems', 'pageTemplateName', 'title']
	readingListTagFields = ['todo']
	topLevelMenuItemFields = ['href', 'text', 'classes']

	indexViewModelFields = baseViewModelFields.concat ['posts']
	twitterViewModelFields = baseViewModelFields
	readingTagViewModelFields = baseViewModelFields.concat ['items', 'tag']
	readingListViewModelFields = baseViewModelFields.concat [ 'items' ]

	# mock data
	validPostId1 = 2944558
	validPostId1AsString = "#{validPostId1}"
	validPostId2 = 2861047
	invalidPostId = 9999999999

	# set our module expectations
	expectedExports =
		topLevelPages: 					[ a.IsObject, a.HasFieldsOfEach(topLevelPageFields) ]
		isTopLevelPage: 				[ a.IsFunction ] # todo: bother doing this?
		ViewModel:						[ a.ReturnsFields(baseViewModelFields, 'myTitle', 'myPageTemplateName') ] #todo check fields
		SharedLayoutViewModel:		[ a.ReturnsFields(sharedViewModelFields, s.topLevelPages.index, {}) ] #todo check fields

		# todo sharedViewModelFields, topLevelMenuItemFields, readingListTagFields
		getSharedLayoutViewModel: 	[ a.MustCallback(s.topLevelPages.index) ]
		getAboutViewModel: 			[ a.MustCallbackWithFields(baseViewModelFields) ]
		getIndexViewModel: 			[ a.MustCallbackWithFields(indexViewModelFields) ]
		getPostViewModel: 			[ a.MustCallback(validPostId1), a.MustCallback(validPostId1AsString) ]
		getTwitterViewModel:			[ a.MustCallbackWithFields(twitterViewModelFields) ]
		getReadingTagViewModel:		[ a.MustCallbackWithFields( readingTagViewModelFields, 'abc') ]
		getReadingListViewModel:		[ a.MustCallbackWithFields( readingListViewModelFields ) ]

	describe 'exports', ->
		scopes = null
		beforeEach -> scopes = th.mockGithubApis [validPostId1, validPostId2], invalidPostId
		afterEach -> scopes.done()

		it 'should have the correct exports', (done) -> a.verify expectedExports, '../lib/shared', done

