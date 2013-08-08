'use strict';

var s = require('../lib/shared'),
    Feed = require('feed')
;

/**
 * [exports description]
 * @param  {[type]} app [description].
 */
module.exports = function(app) {

    app.get('/rss', function (req, res) {

        // Initializing feed object
        var feed = new Feed({
            title:          'Rarely updated blog',
            description:    'The feed of the blog that may be updated, rarely!',
            link:           'http://rarelyupdated.azurewebsites.net/',
            image:          'http://rarelyupdated.azurewebsites.net/logo.png',
            copyright:      'Copyright © 2013 Adam Chester. All rights reserved',

            author: {
                name:       'Adam Chester',
                email:      'adamchester@gmail.com',
                link:       'http://twitter.com/adamchester'
            }
        });

        // Function requesting the last 5 posts to a database. This is just an
        // example, use the way you prefer to get your posts.
        s.getFeedModel(function(err, model) {
            if(err) {
                console.log('blah');
                res.send('404 Not found', 404);
            }
            else {
                for(var key in model.posts) {
                    var fullUrl = 'http://rarelyupdated.azurewebsites.net' + model.posts[key].url;

                    feed.item({
                        title:          model.posts[key].title,
                        link:           fullUrl,
                        description:    model.posts[key].content_html,
                        date:           model.posts[key].date,
                        guid:           fullUrl,
                    });
                }

                // Setting the appropriate Content-Type
                res.set('Content-Type', 'text/xml');

                // Sending the feed as a response
                res.send(feed.render('rss-2.0'));
            }
        });

    });

};
