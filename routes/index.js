var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');

var User = require('../models/user');

let transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: 'agoyal2001@gmail.com',
		pass: process.env.HSIMPACT_GMAIL_PASSWORD
	}
});

// Get Homepage
router.get('/', function(req, res) {
	res.render('index', {
		isHomePage: true,
		signup_msg: req.flash('signup_msg')
	});
});

// Post Homepage
router.post('/send', function(req, res) {
	var emailText = 'Signup: ' + req.body.email;
	let mailOptions = {
		from: '"Ayush Goyal" <agoyal2001@gmail.com>', // sender address
		to: 'agoyal2001@gmail.com', // list of receivers
		subject: 'HS Impact App - Signup', // Subject line
		text: emailText
	};
	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error);
		}
		req.flash('signup_msg', true);
		res.redirect('/#cta');
	});
});


// Get Contact
router.get('/contact', function(req, res) {
	res.render('contact', {
		success_msg: req.flash('success_msg')
	});
});

// Post Contact
router.post('/contact/send', function(req, res) {
	var emailText = 'From: ' + req.body.name + ' Email: ' + req.body.email + ' Subject: ' + req.body.subject + ' Message: ' + req.body.message;
	let mailOptions = {
		from: '"Ayush Goyal" <agoyal2001@gmail.com>', // sender address
		to: 'agoyal2001@gmail.com', // list of receivers
		subject: 'HS Impact App - Contact Form', // Subject line
		text: emailText
	};
	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error);
		}
		req.flash('success_msg', 'Message sent. Thank you for your feedback!');
		res.redirect('/contact');
	});
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

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.profile.address.city) {
			res.redirect('/user/' + (req.user.profile.username).toLowerCase());
		} else {
			if (req.user.profile.account_type == "Student") {
				res.redirect('/signup/new/student');
			} else if (req.user.profile.account_type == "Parent") {
				res.redirect('/signup/new/parent');
			} else {
				var err = new Error('User account type invalid');
				err.status = 400;
				next(err);
			}
		}
	} else {
		return next();
	}
}

// show the login form
router.get('/login', isLoggedIn, function(req, res) {
	res.render('login', {
		error_msg: req.flash('error_msg')
	});
});

// show the signup form
router.get('/signup', isLoggedIn, function(req, res) {
	res.render('signup', {
		error_msg: req.flash('error_msg')
	});
});



function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.profile.address.city && req.user.local.phone.area_code) {
			console.log(req.user.local.phone);
			console.log('next');
			return next();
		} else {
			if (req.user.profile.account_type == "Student") {
				res.redirect('/signup/new/student');
			} else if (req.user.profile.account_type == "Parent") {
				res.redirect('/signup/new/parent');
			} else {
				var err = new Error('User account type invalid');
				err.status = 400;
				next(err);
			}
		}
	} else {
		req.flash('error_msg', 'You must be logged in to view this page');
		res.redirect('/login');
	}
}

function infoFilledOut(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.profile.address.city && req.user.local.phone.area_code) {
			res.redirect('/user/' + (req.user.profile.username).toLowerCase());
		} else {
			next();
		}
	} else {
		req.flash('error_msg', 'You must be logged in to view this page');
		res.redirect('/login');
	}
}

router.get('/signup/new/student', infoFilledOut, function(req, res) {
	res.render('signup-new-student', {
		error_msg: req.flash('error_msg')
	});
});

router.get('/signup/new/parent', infoFilledOut, function(req, res) {
	res.render('signup-new-parent', {
		error_msg: req.flash('error_msg')
	});
});

router.get('/user', ensureAuthenticated, function(req, res) {
	res.redirect('/account/profile');
})

router.get('/user/:username', ensureAuthenticated, function(req, res, next) {
	if (req.user.profile.username == req.params.username) {
		res.render('profile');
	} else {
		User.findOne({
			'profile.username': req.params.username
		}, function(err, user) {
			if (err) {
				next(err);
			}
			// check to see if theres already a user with that username 
			if (user) {
				res.render('profile-other', {
					otherProfile: user.profile
				})
			} else { // else return user not found
				var err = new Error('User profile not found');
				err.status = 404;
				next(err);
			}
		})
	}
});

router.get('/account/profile', ensureAuthenticated, function(req, res) {
	res.render('account-profile');
});

router.get('/account/settings', ensureAuthenticated, function(req, res) {
	res.render('account-settings', {
		email: req.user.local.email,
		phone: req.user.local.phone
	});
});

router.get('/account/notifications', ensureAuthenticated, function(req, res) {
	res.render('account-notifications');
});

router.get('/account/password', ensureAuthenticated, function(req, res) {
	res.render('account-password');
});

router.get('/account/payment', ensureAuthenticated, function(req, res) {
	res.render('account-payment');
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