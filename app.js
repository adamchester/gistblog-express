
/**
 * Module dependencies.
 */

var express = require('express'),
	util = require('util'),
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

// configure routes
require('./routes/posts')(app);
require('./routes/reading')(app);
require('./routes/about')(app);

// must happen last
require('./routes/global')(app);

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
