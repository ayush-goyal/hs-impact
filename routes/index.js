var express = require('express');
var router = express.Router();

// Get Homepage
router.get('/', function(req, res) {
	res.render('index', {
		isHomePage: true
	});
});

// Get Contact
router.get('/contact', function(req, res) {
	res.render('contact');
});

// Post Contact
router.post('/contact', function(req, res) {
	//TODO: ADD POST FUNCTIONALITY
	console.log("Message submitted");
});

// Get About
router.get('/about', function(req, res) {
	res.render('about');
});

// Get Terms
router.get('/legal/terms', function(req, res) {
	res.render('terms');
});

// Get Privacy
router.get('/legal/privacy', function(req, res) {
	res.render('privacy');
});

// show the login form
router.get('/login', function(req, res) {
	res.render('login', {
		error_msg: req.flash('error_msg')
	});
});

// show the signup form
router.get('/signup', function(req, res) {
	res.render('signup', {
		error_msg: req.flash('error_msg')
	});
});


function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		req.flash('error_msg', 'You must be logged in to view this page');
		res.redirect('/login');
	}
}

router.get('/profile', ensureAuthenticated, function(req, res) {
	res.render('profile', {
		name: req.user.name
	});
});


module.exports = router;


/*
// Login
router.get('/login', function(req, res) {
	res.render('login');
});

// Signup
router.get('/signup', function(req, res) {
	res.render('signup');
});*/


/*// Signup User
router.post('/signup', function(req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		res.render('signup', {
			errors: errors
		});
	} else {
		var newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password
		});

		User.createUser(newUser, function(err, user) {
			if (err) throw err;
			console.log(user);
		});

		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('/users/login');
	}
});*/