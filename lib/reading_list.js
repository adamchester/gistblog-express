
var _ = require("underscore");

var ReadingList = (function () {

	function Constructor() {
	}

	// see http://www.epochconverter.com/programming/#javascript
	function epochToDate(epoch) {
		return new Date(epoch * 1000.0);
	}

	function timeAdded(readingListItem) {
		return readingListItem.time_added;
	}

	function self(it) { return it; }

	function getMostRecentlyAddedDate(items) {
		return _.chain(items)
			.map(timeAdded)
			.max()
			.value();
	}

	function toTagItem(tagName) {
		return { href: '/reading/tags/' + tagName, name: tagName, classes: null };
	}

	function toReadingListItem(item) {
		return {
			id: Number(item.item_id),
			title: item.title || '[no title]',
			url: item.url,
			time_added: epochToDate(item.time_added),
			time_updated: epochToDate(item.time_updated),
			tags: item.tags ? item.tags.split(',') : [],
			isRead: item.state === 1
		};
	}

	function toReadingListItems(items) {
		return _.chain(items)
			.map(toReadingListItem)
			.sortBy(timeAdded)
			.reverse()
			.value();
	}

	function extractTags(readingListItems) {
		return _.chain(readingListItems)
			.map(function (item) { return item.tags; })
			.flatten()
			.uniq()
			.sortBy(self)
			.map(toTagItem)
			.value();
	}

	function getTags(callback) {
		getReadingList(function gotReadingList(error, model) {
			if (error) {
				return callback(error);
			}

			callback(null, extractTags(model));
		});
	}

	function getReadingListForTag(tagName, callback) {
		getReadingList(function gotReadingList(error, model) {
			if (error) return callback(error);

			var itemsForTag = _.chain(model)
				.filter(function(item) { return _(item.tags).contains(tagName); })
				.value();

			callback(null, itemsForTag);
		});
	}

	function createUpdatedReadingList(originalItems, updatedItems) {
		// var originalAsArray = _(original).toArray();
		// var updatedAsArray = _(updated).toArray();
		// var concatInput = [readingListJson, moreReadingListJson];
		// var fullList = [].concat.apply([], concatInput);
		// console.log(fullList.length);
	}

	function getReadingList(callback) {
		// TODO: connect to http://getpocket.com API instead
		var additionalReadingListJson = _(require('../test/assets/reading_list_since.json').list).toArray();
		
		var readingListJson = _(require('../test/assets/reading_list.json')).toArray();
		
		var concatInput = [readingListJson, additionalReadingListJson];
		var fullList = [].concat.apply([], concatInput);

		var itemsById = _(fullList).chain()
			.groupBy(function (item) { return item.item_id; })
			//.filter(function (group) { return group.length > 1; })
			.value();

		var readingListModel = toReadingListItems(fullList);

		callback(null, readingListModel);
	}

	Constructor.prototype = {
		toTagItem: toTagItem,
		self: self,
		getTags: getTags,
		extractTags: extractTags,
		getReadingList: getReadingList,
		getReadingListForTag: getReadingListForTag,
		toReadingListItem: toReadingListItem,
		toReadingListItems: toReadingListItems,
		getMostRecentlyAddedDate: getMostRecentlyAddedDate
	};

	return Constructor;
}());

module.exports = new ReadingList();
