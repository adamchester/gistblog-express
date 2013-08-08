"use strict";

var express = require('express'),
  util = require('util'),
  http = require('http');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  // custom middleware
  app.use(require('./middleware/locals'));

  // built-in
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


/**
* ERROR MANAGEMENT
* -------------------------------------------------------------------------------------------------
* error management - instead of using standard express / connect
* error management, we are going
* to show a custom 404 / 500 error using jade and the middleware
* errorHandler (see ./middleware/errorHandler.js)
**/
var errorOptions = { dumpExceptions: true, showStack: true };
app.configure('development', function() { });
app.configure('production', function() {
    errorOptions = {};
});
app.use(require('./middleware/errorHandler')(errorOptions));


// configure routes
require('./routes/posts')(app);
require('./routes/reading')(app);
require('./routes/about')(app);
require('./routes/feed')(app);

// must happen last
require('./routes/global')(app);

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

