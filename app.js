
/**
 * Module dependencies.
 */

var express = require('express'),
  routes = {
    Posts: require('./routes/posts').Posts,
    About: require('./routes/about').About,
    Reading: require('./routes/reading').Reading
  },
  http = require('http');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
});

app.get('/', routes.Posts.index);
app.get('/posts/:id', routes.Posts.post);
app.get('/about', routes.About.index);
app.get('/twitter', routes.Posts.twitter);
app.get('/reading', routes.Reading.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
