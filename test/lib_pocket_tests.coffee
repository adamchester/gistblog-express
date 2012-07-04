
p = new (require './lib_pocket').Pocket 'adamchester', 'ac0280', 'dkhp5F21AaKN3u4f1dg0G7eg60dDAbz7'

assert = require 'assert'
_ = require 'underscore'

describe 'pocket', ->
	it 'should do whatever', ->

		toReadingListItem = (pocketApiListItem) ->
			return { 
				id: Number(pocketApiListItem.item_id)
				, title: pocketApiListItem.title
				, url: pocketApiListItem.url
				, time_added: new Date(pocketApiListItem.time_added * 1000) # see http://www.epochconverter.com/programming/#javascript
				, time_updated: new Date(pocketApiListItem.time_updated * 1000)
				, tags: (if pocketApiListItem.tags isnt undefined then pocketApiListItem.tags.split(','))
				, isRead: (pocketApiListItem.state is 1)
			}

		list = require './assets/reading_list_page1.json'
		items = _.chain(list.list).map(toReadingListItem).value()
		# console.log(JSON.stringify(items))

	# it 'should do something', (done) ->
	# 	p.get { count: 10 }, (err, pages) ->
	# 		unless err
	# 			console.log JSON.stringify(pages)
	# 		else
	# 			console.log err

	# 		done()
