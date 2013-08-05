
var _ = require('underscore'),
	url = require('url'),
	tagc = require('./tag-cloud'),
	assert = require('assert');

var ReadingList = (function() {
	'use strict';

	function Constructor() {
	}

	function ReadingListItem(values) {
		this.id = values.id; // pocket.item_id
		this.title = values.title; // pocket.title || '[no title]',
		this.url = values.url; // pocket.url,
		this.time_added = values.time_added; // epochToDate(pocket.time_added),
		this.time_updated = values.time_updated; // epochToDate(pocket.time_updated),
		this.tags = _.extend([], values.tags); // deep copy - pocket.tags ? pocket.tags.split(',') : [],
		this.isRead = values.isRead; // pocket.state === 1
	}

	/**
	* Updates the values in this reading list item with the values from
	* the updated.
	* @param  {ReadingListItem} updated Object must have the same id. Other field values will be copyed to this one.
	*/
	ReadingListItem.prototype.update = function(updated) {
		assert.equal(this.id, updated.id);
		if (updated.title) { this.title = updated.title; }
		if (updated.url) { this.url = updated.url; }
		if (updated.isRead) { this.isRead = updated.isRead; }
		if (updated.time_added) { this.time_added = updated.time_added; }
		if (updated.time_updated) { this.time_updated = updated.time_updated; }
		if (updated.tags) { this.tags = _.extend([], updated.tags); } // deep copy
	};

	ReadingListItem.prototype.fromPocketItem = function(item) {
		return new ReadingListItem({
			id: Number(item.item_id),
			title: item.title || url.parse(item.url).hostname,
			url: item.url,
			time_added: c.epochToDate(item.time_added),
			time_updated: c.epochToDate(item.time_updated),
			tags: item.tags ? item.tags.split(',') : [],
			isRead: item.state === 1
		});
	};

	/**
	* Grouping/Sorting/Filtering functions
	* @type {Object}
	*/
	var c = {
		// see http://www.epochconverter.com/programming/#javascript
		epochToDate: function(epoch) { return new Date(epoch * 1000.0); },
		timeAdded: function(readingListItem) { return readingListItem.time_added; },
		lengthGt1: function(group) { return group.length > 1; },
		self: function(it) { return it; },
		itemId: function(item) { return item.id; },
		tags: function(item) { return item.tags; },
		title: function(item) { return item.title; },
		name: function(item) { return item.name; },
		firstItemInArray: function(array) { return array[0]; },
		containsTag: function(tagName) { return function(item) { return _(item.tags).contains(tagName); }; },
		tagNameEquals: function(tagName) { return function(tag) { return tag.name === tagName; }; }
	};

	function toReadingListItem(item) {
		return ReadingListItem.prototype.fromPocketItem(item);
	}

	function toReadingListItems(items) {
		return _.chain(items)
			.map(toReadingListItem)
			.sortBy(c.timeAdded)
			.reverse()
			.value();
	}

	function getMostRecentlyAddedDate(items) {
		return _.chain(items).map(c.timeAdded).max()	.value();
	}

	function getTags(callback) {
		getReadingList(function gotReadingList(error, model) {
			if (error) {
				return callback(error);
			}
			callback(null, tagc.extractTags(model,{tagUrlPrefix: '/reading/tags/'}));
		});
	}

	function getTag(tagName, callback) {
		getTags(function gotTags(error, model) {
			if (error) { return callback(error); }
			var tag = _(model).find(c.tagNameEquals(tagName));
			if (!tag) {
				return callback(new Error('The tag ' + tagName + ' was not found'));
			}
			callback(null, tag);
		});
	}

	function getReadingListForTag(tagName, callback) {

		getReadingList(function gotReadingList(error, model) {
			if (error) { return callback(error); }

			var itemsForTag = _.chain(model)
				.filter(c.containsTag(tagName))
				.value();

			if (itemsForTag.length === 0) {
				return callback(new Error('The tag ' + tagName + ' was not found'));
			}

			callback(null, itemsForTag);
		});
	}

	function getUpdatedReadingList(originalItems, updatedItems) {
		var myHash = [];

		// get a combined list (original + updated)
		// and sort by time_added
		var combinedByItemIdSorted = _.chain(originalItems.concat(updatedItems))
			.sortBy(c.timeAdded).reverse()
			.groupBy(c.itemId)
			.value();

		// Modify the 'original' with the 'updated' values
		_.chain(combinedByItemIdSorted)
			.filter(c.lengthGt1)
			.each(function(item, index) {
				// items are in descending time order, update from last to first
				// TODO: handle the case where > 1 update ?
				item[1].update(item[0]);
				assert.equal(JSON.stringify(item[0]), JSON.stringify(item[1]));
			});

		return _.chain(combinedByItemIdSorted)
			.map(c.firstItemInArray)
			.sortBy(c.timeAdded).reverse()
			.value();
	}

	function getReadingList(callback) {
		// TODO: connect to http://getpocket.com API instead
		var rljson = require('../test/assets/reading_list.json');
		var rljsonSince = require('../test/assets/reading_list_since.json').list;
		var original = toReadingListItems(rljson);
		var additional = toReadingListItems(rljsonSince);
		var readingListModel = getUpdatedReadingList(original, additional);
		callback(null, readingListModel);
	}

	Constructor.prototype = {
		getTags: getTags,
		getTag: getTag,
		getReadingList: getReadingList,
		getReadingListForTag: getReadingListForTag,
		toReadingListItem: toReadingListItem,
		toReadingListItems: toReadingListItems,
		getMostRecentlyAddedDate: getMostRecentlyAddedDate
	};

	return Constructor;
}());

module.exports = new ReadingList();
