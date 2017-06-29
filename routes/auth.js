var express = require('express');
var router = express.Router();
var passport = require('passport');
var twilio = require('twilio');
var speakeasy = require('speakeasy');
var nodemailer = require('nodemailer');

var User = require('../models/user');

// Create an authenticated client to access the Twilio REST API
var client = twilio(process.env.HSIMPACT_TWILIO_ACCOUNT_SID, process.env.HSIMPACT_TWILIO_AUTH_TOKEN);

function sendText(number, message) {
	client.messages.create({
		to: number,
		from: process.env.HSIMPACT_TWILIO_NUMBER,
		body: message
	}, function(err, message) {
		if (err) {
			console.log(err);
			return err;
		} else {
			return null;
		}
	});
}

let transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: 'agoyal2001@gmail.com',
		pass: process.env.HSIMPACT_GMAIL_PASSWORD
	}
});

function sendEmail(recipient, subject, text, html) {
	let mailOptions = {
		from: '"HS Impact" <agoyal2001@gmail.com>', // sender address
		to: recipient, // list of receivers
		subject: subject, // Subject line
		text: text,
		html: html
	};
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error);
			return error;
		}
		return null;
	});
}

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
							res.redirect('/user/' + (req.body.username).toLowerCase());
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
							res.redirect('/user/' + (req.body.username).toLowerCase());
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
			if (user.local.phone.area_code != req.body.phone1 || user.local.phone.prefix != req.body.phone2 || user.local.phone.line_number != req.body.phone3) {
				user.local.verification.phone = undefined;
				user.local.phone.area_code = req.body.phone1;
				user.local.phone.prefix = req.body.phone2;
				user.local.phone.line_number = req.body.phone3;
			}
			if (user.local.email != req.body.email) {
				user.local.verification.email = undefined;
				user.local.email = req.body.email;
			}
			user.save(function(err) {
				if (err) {
					throw err;
				} else {
					res.redirect('/account/settings');
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

// post /auth/account/verify/phone/send
router.post('/account/verify/phone/send', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			console.log(req.body.phone);
			var reqPhone = req.body.phone.replace(/\D/g, '');
			var userPhone = (user.local.phone.area_code + user.local.phone.prefix + user.local.phone.line_number);
			var code = speakeasy.totp({
				secret: 'jlaksd73kjd978i3'
			});
			user.local.verification.phone.code = code;
			if (reqPhone == userPhone) {
				console.log('hello');
				sendText(reqPhone, 'Your verification code is ' + code);
			} else if (reqPhone.length == 10) {
				user.local.phone.area_code = reqPhone.slice(0, 3);
				user.local.phone.prefix = reqPhone.slice(3, 6);
				user.local.phone.line_number = reqPhone.slice(6, 10);
				sendText(reqPhone, 'Your verification code is ' + code);
			}
			user.save(function(err) {
				if (err) {
					throw err;
				} else {
					res.redirect('/account/verify/phone/code');
				}
			})
		}
	})
});

// post /auth/account/verify/phone/code
router.post('/account/verify/phone/code', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			if (req.body.code == user.local.verification.phone.code) {
				user.local.verification.phone.verified = true;
				user.save(function(err) {
					if (err) {
						throw err;
					} else {
						req.flash('success_msg', 'Phone number verified');
						res.redirect('/account/settings');
					}
				})
			} else {
				req.flash('error_msg', 'Verification code is incorrect');
				res.redirect('/account/verify/phone/code');
			}
		}
	})
});

// post /auth/account/verify/email/send
router.post('/account/verify/email/send', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			var reqEmail = req.body.email;
			var userEmail = user.local.email;
			var code = speakeasy.totp({
				secret: 'jlaksd73kjd978i3'
			});
			user.local.verification.email.code = code;
			if (reqEmail != userEmail) {
				user.local.email = reqEmail;
			}
			sendEmail(reqEmail, 'HS Impact - Email Verification', 'Please click on the following link to verify your email: ' + 'https://hs-impact.herokuapp.com/account/verify/email/code/' + code + ' or enter this code: ' + code, 'Please click <a href="https://hs-impact.herokuapp.com/account/verify/email/code/' + code + '">here</a> to verify your email or enter this code: ' + code);
			user.save(function(err) {
				if (err) {
					throw err;
				} else {
					res.redirect('/account/verify/email/code');
				}
			})
		}
	})
});

// post /auth/account/verify/email/code
router.post('/account/verify/email/code', function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			if (req.body.code == user.local.verification.email.code) {
				user.local.verification.email.verified = true;
				user.save(function(err) {
					if (err) {
						throw err;
					} else {
						req.flash('success_msg', 'Email verified');
						res.redirect('/account/settings');
					}
				})
			} else {
				req.flash('error_msg', 'Verification code is incorrect');
				res.redirect('/account/verify/email/code');
			}
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