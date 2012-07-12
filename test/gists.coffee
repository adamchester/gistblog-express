gists = require '../lib/gists.js'
assert = require 'assert'
th = require './test_helpers'


describe 'gists', ->

	expectedBlogPostFields = ['id', 'title', 'date', 'content_md', 'content_html', 'comment_count']

	describe 'module', ->
		it 'should export', -> assert gists isnt undefined
		it 'should export getGistMarkdown', -> assert gists.getGistMarkdown isnt undefined
		it 'should export getGistHtml', -> assert gists.getGistHtml isnt undefined
		it 'should export getBlogPostsForUser', -> assert gists.getBlogPostsForUser isnt undefined
		it 'should export getBlogPost', -> assert gists.getBlogPost isnt undefined
		it 'should not export toBlogPost', -> assert gists.toBlogPost is undefined

	describe 'method', ->

		githubApiScopes = null
		beforeEach -> githubApiScopes = th.mockGithubApis([2944558, 2861047], 9999999999)
		afterEach -> githubApiScopes.done()

		describe '#getGistMarkdown()', ->

			it 'should return null gist and an error 404 when not found', (done) ->
				gists.getGistMarkdown 9999999999, (error, gist) ->
					th.assertCallbackError gist, error, done

			it 'should get the markdown for a gist', (done) ->
				gists.getGistMarkdown 2944558, (error, gist) ->
					th.assertCallbackSuccess gist, error, done, ->
						gist.markdown isnt undefined

		describe '#getGistHtml()', ->
			it 'should get the html-formatted content for a gist', (done) ->
				gists.getGistHtml 2944558, (error, markdown, html) ->
					result = { m: markdown, h: html}
					th.assertCallbackSuccess result, error, done, ->
						assert result.m
						assert result.h

			it 'should return null gist and an error when not found', (done) -> 
				gists.getGistHtml 9999999999, (error, markdown, html) ->
					result = null
					th.assertCallbackError result, error, done, ->
						assert not markdown
						assert not html

		describe '#getBlogPost()', ->

			it 'should return the post with fields: [id, title, date, content_md, content_html, comment_count]', (done) ->
				gists.getBlogPost 2944558, (error, post) -> 
					th.assertCallbackSuccess post, error, done, ->
						th.assertHasFields post, expectedBlogPostFields

			it 'should return null with an error when the post does not exist', (done) ->
				gists.getBlogPost 9999999999, (error, post) -> 
					th.assertCallbackError post, error, done

		describe '#getBlogPostsForUser()', ->

			it 'should return objects with fields: [id, title, date, content_md, content_html, comment_count]', (done) ->
				gists.getBlogPostsForUser {username: 'adamchester', allContents: true}, (error, posts) ->
					th.assertCallbackSuccess posts, error, done, ->
						th.assertHasFields(post, expectedBlogPostFields) for post in posts

			it 'should return null with an error when the user does not exist', (done) ->
				gists.getBlogPostsForUser {username: 'invalid'}, (error, posts) ->
					th.assertCallbackError posts, error, done



