# p = new (require './lib_pocket').Pocket '', '', ''

assert = require 'assert'
_ = require 'underscore'

rl = require '../lib/reading_list'
th = require './test_helpers'
pkt = require './assets/pocket'

readingListItemFields = ['title', 'url', 'tags', 'time_added']
tagFields = ['name', 'href']

describe 'reading list', ->
	it 'should export itself', -> assert rl isnt null
	it 'should export getReadingList', -> assert rl.getReadingList isnt null
	it 'should export getTags', -> assert rl.getTags isnt null
	it 'should export extractTags', -> assert rl.extractTags isnt null

	describe 'method', ->

		describe '#extractTags()', ->
			it 'should return tags with the tag fields', ->
				rl.getReadingList (error, list) ->
					tags = rl.extractTags(list)
					th.assertHasFields(tag, tagFields) for tag in tags

			it 'should return only unique tags given duplicate tags in the reading list items', ->
				# todo

			it 'should sort the tags alphabetically', ->
				# todo

		describe '#getTags()', ->

			it 'should make the callback', (done) ->
				rl.getTags (error, tags) -> th.assertCallbackSuccess tags, error, done

			it 'should return the tags with tag fields', (done) ->
				rl.getTags (error, tags) ->
					th.assertHasFields(tag, tagFields) for tag in tags
					done()

		describe '#getReadingList()', ->

			it 'should make the callback', (done) ->
				rl.getReadingList (error, list) -> th.assertCallbackSuccess list, error, done

			it 'should return a list of objects with the correct feilds', (done) ->
				rl.getReadingList (error, list) -> th.assertCallbackSuccess list, error, done, ->
					th.assertHasFields(item, readingListItemFields) for item in list


	# it 'should do something', (done) ->
	# 	p.get { count: 10 }, (err, pages) ->
	# 		unless err
	# 			console.log JSON.stringify(pages)
	# 		else
	# 			console.log err

	# 		done()
