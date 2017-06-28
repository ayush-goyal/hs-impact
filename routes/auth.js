var express = require('express');
var router = express.Router();
var passport = require('passport');

var User = require('../models/user');

//GET /auth/login/facebook
router.get('/facebook',
	passport.authenticate('facebook', {
		scope: ["email"]
	}));

//GET /auth/facebook/return
router.get('/facebook/return',
	passport.authenticate('facebook', {
		successRedirect: '/profile',
		failureRedirect: '/login'
	})
);

//GET /auth/logout 
router.get('/logout', function(req, res) {
	req.session.destroy(function(err) {
		res.redirect('/'); //Inside a callback… bulletproof!
	});
});

function checkFieldsLogin(req, res, next) {
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('password', 'Password is required').notEmpty();

	var errors = req.validationErrors();

	if (errors) {
		req.flash('error_msg', errors[0].msg)
		res.render('login', {
			error_msg: req.flash('error_msg')
		});
	} else {
		next();
	}
}

function checkFieldsSignup(req, res, next) {
	req.checkBody('firstName', 'First name is required').notEmpty();
	req.checkBody('lastName', 'Last name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('passwordConfirm', 'Passwords do not match').equals(req.body.password);
	req.checkBody('password', 'Password must be at least 6 characters long').isLength({
		min: 6,
		max: 100
	});
	var errors = req.validationErrors();

	if (errors) {
		req.flash('error_msg', errors[0].msg)
		res.render('signup', {
			error_msg: req.flash('error_msg')
		});
	} else {
		next();
	}
}

// process the login form
router.post('/login', checkFieldsLogin, function(req, res, next) {
	passport.authenticate('local-login', function(err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			req.flash('error_msg', info.error_msg);
			return res.redirect('/login');
		}
		req.logIn(user, function(err) {
			if (err) {
				return next(err);
			}
			req.session.save(() => { // Explicitly save the session before redirecting!
				res.redirect('/user/' + (req.user.profile.username).toLowerCase());
			})
		});
	})(req, res, next);
});


// process the signup form
router.post('/signup', checkFieldsSignup, function(req, res, next) {
	passport.authenticate('local-signup', function(err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			req.flash('error_msg', info.error_msg);
			return res.redirect('/signup');
		}
		req.logIn(user, function(err) {
			if (err) {
				return next(err);
			}
			req.session.save(() => { // Explicitly save the session before redirecting!
				if (req.user.profile.account_type == "Student") {
					res.redirect('/signup/new/student');
				} else if (req.user.profile.account_type == "Parent") {
					res.redirect('/signup/new/parent');
				} else {
					var err = new Error('User account type invalid');
					err.status = 400;
					next(err);
				}
			})
		});
	})(req, res, next);
});


// post /auth/signup/new/student
router.post('/signup/new/student', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			User.findOne({
				'profile.username': (req.body.username).toLowerCase()
			}, function(err, userCheck) {
				if (err) {
					throw (err);
				}
				// check to see if theres already a user with that username
				if (userCheck) {
					req.flash('error_msg', 'Username already exists');
					res.redirect('/signup/new/student');
				} else { // else return user not found
					user.profile.username = (req.body.username).toLowerCase();
					user.local.phone.area_code = req.body.phone1;
					user.local.phone.prefix = req.body.phone2;
					user.local.phone.line_number = req.body.phone3;
					user.profile.date_of_birth.month = req.body.date_of_birth.slice(0, 2);
					user.profile.date_of_birth.day = req.body.date_of_birth.slice(3, 5);
					user.profile.date_of_birth.year = req.body.date_of_birth.slice(6, 10);
					user.profile.school = req.body.school;
					user.profile.address.line_1 = req.body.line_1;
					user.profile.address.line_2 = req.body.line_2;
					user.profile.address.city = (req.body.city).charAt(0).toUpperCase() + req.body.city.slice(1).toLowerCase();
					user.profile.address.state = req.body.state;
					user.profile.address.zip = req.body.zip;
					user.save(function(err) {
						if (err) {
							throw err;
						} else {
							res.redirect('/user/' + (req.user.profile.username).toLowerCase());
						}
					})
				}
			})
		}
	})
});

// post /auth/signup/new/parent
router.post('/signup/new/parent', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			User.findOne({
				'profile.username': (req.body.username).toLowerCase()
			}, function(err, userCheck) {
				if (err) {
					throw (err);
				}
				// check to see if theres already a user with that username
				if (userCheck) {
					req.flash('error_msg', 'Username already exists');
					res.redirect('/signup/new/parent');
				} else { // else return user not found
					user.profile.username = (req.body.username).toLowerCase();
					user.local.phone.area_code = req.body.phone1;
					user.local.phone.prefix = req.body.phone2;
					user.local.phone.line_number = req.body.phone3;
					user.profile.address.line_1 = req.body.line_1;
					user.profile.address.line_2 = req.body.line_2;
					user.profile.address.city = (req.body.city).charAt(0).toUpperCase() + req.body.city.slice(1).toLowerCase();
					user.profile.address.state = req.body.state;
					user.profile.address.zip = req.body.zip;
					user.save(function(err) {
						if (err) {
							throw err;
						} else {
							res.redirect('/user/' + (req.user.profile.username).toLowerCase());
						}
					})
				}
			})
		}
	})
});

// post /auth/account/profile/update
router.post('/account/profile/update', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			user.profile.name.first = req.body.firstName;
			user.profile.name.last = req.body.lastName;
			user.profile.address.line_1 = req.body.line_1;
			user.profile.address.line_2 = req.body.line_2;
			user.profile.address.city = (req.body.city).charAt(0).toUpperCase() + req.body.city.slice(1).toLowerCase();
			user.profile.address.state = req.body.state;
			user.profile.address.zip = req.body.zip;
			user.profile.biography = req.body.biography;
			user.save(function(err) {
				if (err) {
					throw err;
				} else {
					res.redirect('/user/' + (req.user.profile.username).toLowerCase());
				}
			})
		}
	})
});

// post /auth/account/update
router.post('/account/update', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			user.local.phone.area_code = req.body.phone1;
			user.local.phone.prefix = req.body.phone2;
			user.local.phone.line_number = req.body.phone3;
			user.local.email = req.body.email;
			user.save(function(err) {
				if (err) {
					throw err;
				} else {
					res.redirect('/user/' + (req.user.profile.username).toLowerCase());
				}
			})
		}
	})
});

// post /auth/account/password/update
router.post('/account/password/update', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			user.local.password = user.generateHash(req.body.password);
			user.save(function(err) {
				if (err) {
					throw err;
				} else {
					res.redirect('/user/' + (req.user.profile.username).toLowerCase());
				}
			})
		}
	})
});



module.exports = router;




/*passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUsername(username, function(err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, {
					message: 'Unknown User'
				}); 
			}

			User.comparePassword(password, user.password, function(err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, {
						message: 'Invalid password'
					});
				}
			});
		});
	}));

router.post('/login',
	passport.authenticate('local', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
	}));*/