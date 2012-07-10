
describe 'pocket', ->

	# p = new (require './lib_pocket').Pocket 
	assert = require 'assert'
	_ = require 'underscore'
	rl = require '../lib/reading_list'

	dateToEpoch = (date) ->
		date.getTime() / 1000.0

	readingListToItems = (pocketApiJson) ->
		_.chain(pocketApiJson.list).map(rl.toReadingListItem).value()

	appendNew = (existingItems, newItems) ->
		a = [existingItems, newItems]
		return ([].concat a...)

	it 'should combine the existing with the new', ->

		existingJson = require './assets/reading_list_page1.json'
		existingItems = readingListToItems(existingJson)

		newJson = require './assets/reading_list_since.json'
		newItems = readingListToItems(newJson)

		combined = appendNew(existingItems, newItems)
		combined = _(combined).sortBy((i) -> i.time_added).reverse()

		console.log "existing: #{existingItems.length}, new: #{newItems.length}, combined: #{combined.length}"


	# it 'should find the last added item, get the newer ones, and combine to the list', (done) ->

	# 	existingItemsRaw = require './assets/reading_list.json'
	# 	existingItems = _(existingItemsRaw).map(rl.toReadingListItem)
	# 	# console.log existingItems
	# 	mostRecentlyAdded = dateToEpoch(rl.getMostRecentlyAddedDate(existingItems))

	# 	console.log "getting items since #{mostRecentlyAdded}"

	# 	p.get { since: mostRecentlyAdded }, (err, pages) ->
	# 		unless err
	# 			console.log JSON.stringify(pages)
	# 		else
	# 			console.log error
	# 		done()

	it 'should do whatever', (done) ->

		list = require './assets/reading_list.json'
		items = _.chain(list.list).map(rl.toReadingListItem).value()
		console.log(JSON.stringify(items))
		done()

	# it 'should get the stats', (done) ->
	# 	p.stats (err, result) ->
	# 		console.log result
	# 		done()

	# it 'should get 10 items', (done) ->
	# 	p.get { count: 10 }, (err, pages) ->
	# 		unless err
	# 			console.log JSON.stringify(pages)
	# 		else
	# 			console.log err

	# 		done()
