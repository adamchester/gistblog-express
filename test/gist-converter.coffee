
describe 'gist-converter', ->
  assert = require 'assert'
  async = require 'async'
  util = require 'util'
  request = require 'request'
  _ = require 'underscore'
  nock = require 'nock'
  gc = require '../lib/gist-converter'
  th = require './test_helpers'

  describe '#toHtmlViaGithub()', ->

    it 'should convert succesfully', (done) ->
      
      url = 'https://api.github.com/markdown'
      postBody =
        text: 'abc **abc** /blah/',
        mode: 'gfm',
        context: 'adamchester'

      headers = {'user-agent':'gistblog'} 

      request { url, json: postBody, headers }, (err, resp, body) ->
        console.log "err: #{err}, code: #{resp.statusCode}, body: #{util.inspect body}"
        done()

      # githubApi = new nock('https://api.github.com').log(console.log)
      #   .post('/markdown', { text: 'abc **abc** /blah/',  mode: 'gfm', context: 'adamchester' })
      #   .reply(200, '<p>abc <strong>abc</strong> /blah/</p>')

      # gc.toHtmlViaGithub 'abc **abc** /blah/', (err, html) ->
      #   console.log err
      #   assert not err
      #   assert.equal html, '<p>abc <strong>abc</strong> /blah/</p>'
      #   done()

  # describe '#convert()', ->
  #   it 'should convert backtick-embedded javascript to html correctly', (done) ->
  #     jstext = "function blah() { return 'blah'; }";
  #     markdown = """abc **abc**
  # ```javascript
  # #{jstext}
  # ```
  # and *after*"""

  #     expectedHtml = """<p>abc <strong>abc</strong>
  # </p>
  # <pre><code class="lang-javascript"><div class="highlight"><pre><span class="kd">function</span> <span class="nx">blah</span><span class="p">()</span> <span class="p">{</span> <span class="k">return</span> <span class="s1">&#39;blah&#39;</span><span class="p">;</span> <span class="p">}</span>
  # </pre></div>
  # </code></pre>
  # <p>and <em>after</em></p>\n"""
  #     gc.convert markdown.toString(), (err, html) ->
  #       assert.equal html, expectedHtml
  #       done()

  #   it 'should convert backtick-embedded coffeescript to html correctly', (done) ->
  #     cstext = """assert.equal something, something
  #     iAmFunction hear, (me, roar) ->
  #       hear me, roar
  #       if something? or somethingElse? then doThis() else doThat()
  #     iAm valid, coffeescript"""
  #     csmarkdown = """abc **abc**
  # ```coffeescript
  # #{cstext}
  # ```
  # and *after*"""
  #     csExpectedHtml = """<p>abc <strong>abc</strong>
  #     </p>
  #     <pre><code class="lang-coffeescript"><div class="highlight"><pre><span class="nx">assert</span><span class="p">.</span><span class="nx">equal</span> <span class="nx">something</span><span class="p">,</span> <span class="nx">something</span>
  #     <span class="nx">iAmFunction</span> <span class="nx">hear</span><span class="p">,</span> <span class="nf">(me, roar) -&gt;</span>
  #       <span class="nx">hear</span> <span class="nx">me</span><span class="p">,</span> <span class="nx">roar</span>
  #       <span class="k">if</span> <span class="nx">something</span><span class="o">?</span> <span class="o">or</span> <span class="nx">somethingElse</span><span class="o">?</span> <span class="k">then</span> <span class="nx">doThis</span><span class="p">()</span> <span class="k">else</span> <span class="nx">doThat</span><span class="p">()</span>
  #     <span class="nx">iAm</span> <span class="nx">valid</span><span class="p">,</span> <span class="nx">coffeescript</span>
  #     </pre></div>
  #     </code></pre>
  #     <p>and <em>after</em></p>\n"""
  #     gc.convert csmarkdown.toString(), (err, html) ->
  #       assert.equal html, csExpectedHtml
  #       done()
