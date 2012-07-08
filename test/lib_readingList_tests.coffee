# p = new (require './lib_pocket').Pocket '', '', ''

assert = require 'assert'
_ = require 'underscore'

rl = require '../lib/reading_list'
th = require './test_helpers'
pkt = require './lib_pocket'

readingListItemFields = ['title', 'url', 'tags', 'time_added']

describe 'reading list', ->
	describe 'module', ->
		it 'should export itself', -> assert rl isnt null
		it 'should export getReadingList', -> assert rl.getReadingList isnt null

	describe 'method', ->
		describe '#getReadingList()', ->

			it 'should make the callback', (done) ->
				rl.getReadingList (error, list) -> th.assertCallbackSuccess list, error, done

			it 'should return a list of objects with [title, url, tags, time_added]', (done) ->
				rl.getReadingList (error, list) -> th.assertCallbackSuccess list, error, done, ->
					th.assertHasFields item, ['title', 'url', 'tags', 'time_added'] for item in list


	# it 'should do something', (done) ->
	# 	p.get { count: 10 }, (err, pages) ->
	# 		unless err
	# 			console.log JSON.stringify(pages)
	# 		else
	# 			console.log err

	# 		done()
