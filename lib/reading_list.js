
var request = require("request")
	, _ = require("underscore")
	, async = require('async')
;

// this 'class' deals with getting data from the pocket API in a consistent way
var ReadingList = (function() {

	var readingListItemCache = [];

	function Constructor() {
	}

	// see http://www.epochconverter.com/programming/#javascript
	function dateToEpoch(date) {
		return date.getTime() / 1000.0;
	}

	function epochToDate(epoch) {
		return new Date(epoch * 1000.0);
	}

	function timeAdded(readingListItem) {
		return readingListItem.time_added;
	}

	function getMostRecentlyAddedDate(items) {		
		var maxTimeAdded = 
			_.chain(items)
			.map(function (item) { return item.time_added; })
			.max()
			.value();

		return maxTimeAdded;
	}

	function toReadingListItem(pocketApiListItem) {
		return { 
			id: Number(pocketApiListItem.item_id)
			, title: (pocketApiListItem.title ? pocketApiListItem.title : '[no title]')
			, url: pocketApiListItem.url
			, time_added: epochToDate(pocketApiListItem.time_added) 
			, time_updated: epochToDate(pocketApiListItem.time_updated)
			, tags: (pocketApiListItem.tags === undefined ? [] : pocketApiListItem.tags.split(','))
			, isRead: (pocketApiListItem.state == 1)
		}
	}

	function getReadingList(callback) {
		// TODO: connect to getpocket API instead
		var readingListJson = require('../test/assets/reading_list.json');

		var readingListItems = _
			.chain(readingListJson)
			.map(toReadingListItem)
			.sortBy(timeAdded)
			.reverse()
			.value();

		callback(readingListItems);
	}

	Constructor.prototype = {
		getReadingList: getReadingList
		,toReadingListItem: toReadingListItem
		,getMostRecentlyAddedDate: getMostRecentlyAddedDate
	};

	return Constructor;
})();


module.exports = new ReadingList();
