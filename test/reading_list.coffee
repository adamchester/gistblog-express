
describe 'reading list', ->

	assert = require 'assert'
	_ = require 'underscore'

	rl = require '../lib/reading_list'
	th = require './test_helpers'
	pkt = require './assets/pocket'
	a = require './asserters'

	readingListItemFields = ['id', 'title', 'url', 'tags', 'time_added', 'time_updated', 'isRead']
	tagFields = ['name', 'href']
	validTagName = 'abc'

	expectedExports =
		getReadingList: [ a.MustCallbackWithFieldsForEach( readingListItemFields ) ]
		getTags: [ a.MustCallbackWithFieldsForEach( tagFields ) ]
		getTag:  [ a.MustCallbackWithFields(tagFields, validTagName) ]
		getReadingListForTag: [ a.MustCallbackWithFieldsForEach( readingListItemFields , validTagName) ]
		toTagItem: []
		extractTags: []
		toReadingListItem: []
		toReadingListItems: []
		getMostRecentlyAddedDate: []

	it 'should have the correct exports', (done) -> a.verify expectedExports, '../lib/reading_list', done

