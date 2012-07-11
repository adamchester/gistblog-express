
/**
 * Module dependencies.
 */

var express = require('express'),
	shared = require('./lib/shared'),
	util = require('util'),
	routes = {
		Posts: require('./routes/posts').Posts,
		About: require('./routes/about').About,
		Reading: require('./routes/reading').Reading,
		Errors: require('./routes/errors').Errors
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

app.use(error);

function error(err, req, res, next) {
	if (err instanceof shared.NotFoundError) {
		console.log('doing a 404 from global error handler!');
		res.render('404', {
			status: 404,
			error: util.inspect(err),
			showDetails: app.settings.showErrorDetails
		});
	}
	else {
		res.render(500, {
			status: 500,
			error: util.inspect(err),
			showDetails: app.settings.showErrorDetails
		});
	}
}

app.configure('development', function(){
	app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
});

app.get('/', routes.Posts.index);
app.get('/posts/:id', routes.Posts.post);
app.get('/about', routes.About.index);
app.get('/twitter', routes.Posts.twitter);
app.get('/reading', routes.Reading.index);
app.get('/reading/tags/:tagName', routes.Reading.tag);

// errors
app.get('/404', routes.Errors.NotFound);
app.get('/403', routes.Errors.NotAllowed);
app.get('/500', routes.Errors.InternalServerError);

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
