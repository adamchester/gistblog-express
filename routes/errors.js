
var s = require('../lib/shared');

var Errors = (function Errors() {

	function Constructor() {
	}

	/*
	* GET /403 page.
	*/
	function NotAllowed(req, res, next) {
		var err = new Error('not allowed!');
		err.status = 403;
		next(err);
	}

	/*
	* GET /404 page.
	*/
	function NotFound(req, res, next) {
		// respond with html page
		if (req.accepts('html')) {
			res.status(404);
			res.render('404', { url: req.url });
			return;
		}

		// respond with json
		if (req.accepts('json')) {
			res.send({ error: 'Not found' });
			return;
		}

		// default to plain-text. send()
		res.type('txt').send('Not found');
	}

	/*
	* GET /500 page.
	*/
	function InternalServerError(req, res, next) {
		// we may use properties of the error object
		// here and next(err) appropriately, or if
		// we possibly recovered from the error, simply next().
		res.status(err.status || 500);
		res.render('500', { error: err });
	}

	Constructor.prototype = {
		NotAllowed: NotAllowed,
		NotFound: NotFound,
		InternalServerError: InternalServerError
	};

	return Constructor;
})();

module.exports.Errors = new Errors();
