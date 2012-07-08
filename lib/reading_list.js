
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

    function getMostRecentlyAddedDate(items) {
        return _.chain(items)
            .map(function (item) { return item.time_added; })
            .max()
            .value();
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

    function getReadingList(callback) {
        // TODO: connect to http://getpocket.com API instead
        var readingListJson = require('../test/assets/reading_list.json');

        var readingListModel = _.chain(readingListJson)
            .map(toReadingListItem)
            .sortBy(timeAdded)
            .reverse()
            .value();

        callback(null, readingListModel);
    }

    Constructor.prototype = {
        getReadingList: getReadingList,
        toReadingListItem: toReadingListItem,
        getMostRecentlyAddedDate: getMostRecentlyAddedDate
    };

    return Constructor;
}());

module.exports = new ReadingList();
