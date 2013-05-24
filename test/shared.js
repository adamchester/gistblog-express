// Generated by CoffeeScript 1.6.2
describe('shared', function() {
  var a, assert, baseViewModelFields, expectedExports, indexViewModelFields, invalidPostId, logging, postsForTagFields, readingListTagFields, readingListViewModelFields, readingTagViewModelFields, s, sharedViewModelFields, th, topLevelMenuItemFields, topLevelPageFields, twitterViewModelFields, validPostId1, validPostId1AsString, validPostId2, validTagName1;

  assert = require('assert');
  s = require('../lib/shared');
  th = require('./test_helpers');
  logging = require('../lib/logging');
  a = require('./asserters');
  baseViewModelFields = ['title', 'pageTemplateName', 'topLevelPage'];
  topLevelPageFields = ['id', 'routePattern', 'name', 'href', 'title', 'pageTemplateName'];
  sharedViewModelFields = ['currentTopLevelPage', 'readingListTags', 'topLevelMenuItems', 'pageTemplateName', 'title'];
  readingListTagFields = ['todo'];
  topLevelMenuItemFields = ['href', 'text', 'classes'];
  indexViewModelFields = baseViewModelFields.concat(['posts']);
  twitterViewModelFields = baseViewModelFields;
  readingTagViewModelFields = baseViewModelFields.concat(['items', 'tag']);
  readingListViewModelFields = baseViewModelFields.concat(['items']);
  postsForTagFields = baseViewModelFields.concat(['posts']);
  validTagName1 = 'nodejs';
  validPostId1 = 2944558;
  validPostId1AsString = "" + validPostId1;
  validPostId2 = 2861047;
  invalidPostId = 9999999999;
  expectedExports = {
    topLevelPages: [a.IsObject, a.HasFieldsOfEach(topLevelPageFields)],
    isTopLevelPage: [a.IsFunction],
    ViewModel: [a.ReturnsFields(baseViewModelFields, 'myTitle', 'myPageTemplateName')],
    SharedLayoutViewModel: [
      a.ReturnsFields(sharedViewModelFields, s.topLevelPages.index, ['tag1', 'tag2'], [
        {
          id: 1
        }
      ])
    ],
    getPostsForTagViewModel: [a.MustCallbackWithFields(postsForTagFields, validTagName1)],
    getSharedLayoutViewModel: [a.MustCallback(s.topLevelPages.index)],
    getAboutViewModel: [a.MustCallbackWithFields(baseViewModelFields)],
    getIndexViewModel: [a.MustCallbackWithFields(indexViewModelFields)],
    getPostViewModel: [a.MustCallback(validPostId1), a.MustCallback(validPostId1AsString)],
    getTwitterViewModel: [a.MustCallbackWithFields(twitterViewModelFields)],
    getReadingTagViewModel: [a.MustCallbackWithFields(readingTagViewModelFields, 'abc')],
    getReadingListViewModel: [a.MustCallbackWithFields(readingListViewModelFields)]
  };
  return describe('exports', function() {
    var scopes;

    scopes = null;
    beforeEach(function() {
      return scopes = th.mockGithubApis([validPostId1, validPostId2], invalidPostId);
    });
    afterEach(function() {
      return scopes.done();
    });
    return it('should have the correct exports', function(done) {
      return a.verify(expectedExports, '../lib/shared', done);
    });
  });
});