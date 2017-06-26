var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('express-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var helmet = require('helmet');

var url = process.env.HSIMPACT_MONGOLAB_URI;
mongoose.Promise = global.Promise;
mongoose.connect(url);
var db = mongoose.connection;
// mongo error
db.on('error', console.error.bind(console, 'Connection error:'));

require('./config/passport')(passport); // pass passport for configuration

// Init App
var app = express();

app.use(helmet());

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({
	defaultLayout: 'layout'
}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
	secret: 'secretcodegoeshere',
	saveUninitialized: true,
	resave: true,
	store: new MongoStore({
		url: url
	})
}));

// Passport init
app.use(passport.initialize());
// Restore session (keeps returning users still signed in )
app.use(passport.session());

// Express Validator
app.use(expressValidator({
	errorFormatter: function(param, msg, value) {
		var namespace = param.split('.'),
			root = namespace.shift(),
			formParam = root;

		while (namespace.length) {
			formParam += '[' + namespace.shift() + ']';
		}
		return {
			param: formParam,
			msg: msg,
			value: value
		};
	}
}));

// Connect Flash
app.use(flash());

// make user name and error available in templates
app.use(function(req, res, next) {
	if (req.isAuthenticated()) {
		res.locals.isSignedIn = true;
		if (req.user) {
			res.locals.currentUserName = req.user.name;
		}
	}
	next();
});


// Connect routes
var routes = require('./routes/index');
app.use('/', routes);

var auth = require('./routes/auth');
app.use('/auth', auth);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('File Not Found');
	err.status = 404;
	next(err);
});

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		status: err.status,
		error: {}
	});
});

// Set Port
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function() {
	console.log('Server started on port ' + app.get('port'));
});