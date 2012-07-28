/*jslint node:true */

var tc = module.exports;

(function(){
  'use strict';

  var _ = require('underscore');

  /**
  * Grouping/Sorting/Filtering functions
  * @type {Object}
  */
  var c = {
    // see http://www.epochconverter.com/programming/#javascript
    lengthGt1: function(group) { return group.length > 1; },
    self: function(it) { return it; },
    itemId: function(item) { return item.id; },
    tags: function(item) { return item.tags; },
    title: function(item) { return item.title; },
    name: function(item) { return item.name; },
    firstItemInArray: function(array) { return array[0]; },
    toTagGroup: function (group) { return { tagName: group[0], count: group.length }; },
    containsTag: function(tagName) { return function(item) { return _(item.tags).contains(tagName); }; },
    tagNameEquals: function(tagName) { return function(tag) { return tag.name === tagName; }; }
  };

  function toTagItem(tagUrlPrefix) {
    return function(tagGroup) {
      var name = tagGroup.tagName;
      var count = tagGroup.count;
      var classes = [];
      if (count <= 5) {
        classes.push('tag-cloud-small');
      }
      if (count > 5 && count <= 10) {
        classes.push('tag-cloud-medium');
      }
      if (count > 10) {
        classes = 'tag-cloud-large';
      }
      return {
        name: name,
        count: count,
        classes: classes,
        href: tagUrlPrefix + name
      };
    };
  }

  tc.extractTags = function extractTags(recordsWithTagsProperty, options) {
    var tagUrlPrefix = options.tagUrlPrefix || '/';
    return _.chain(recordsWithTagsProperty)
      .map(c.tags)
      .flatten()
      .groupBy(c.self)
      .map(c.toTagGroup)
      .map(toTagItem(tagUrlPrefix))
      .sortBy(c.name)
      .value();
  };

}());
