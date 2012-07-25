
describe 'reading list', ->

	assert = require 'assert'
	_ = require 'underscore'

	rl = require '../lib/reading_list'
	th = require './test_helpers'
	pkt = require './assets/pocket'
	a = require './asserters'

	describe '#getTags()', ->
		it 'should return tags in alphabetical order', ->
			rl.getTags (err, result) ->
				sorted = _.chain(result).clone().sortBy((r) -> r.name).value()
				assert.equal JSON.stringify(result), JSON.stringify(sorted)

	it 'should not have any duplicate IDs', (done) ->
		rl.getReadingList (err, result) ->
			idField = (listItem) -> listItem.id
			lengthGreaterThan1 = (group) -> group.length > 1
			grouped = 	_.chain(result).toArray().groupBy(idField).filter(lengthGreaterThan1).value()
			# console.log grouped if grouped.length > 0
			assert.equal grouped.length, 0, "expected no duplicates IDs after getting the reading list"
			done()

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
