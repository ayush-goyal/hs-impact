var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
const aws = require('aws-sdk');
aws.config.update({
	accessKeyId: process.env.HSIMPACT_AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.HSIMPACT_AWS_SECRET_ACCESS_KEY
});

var User = require('../models/user');
var Job = require('../models/job.js');

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

router.get('/calendar', function(req, res) {
	res.render('calendar');
});

router.get('/image', function(req, res) {
	res.render('image', {
		isPictureUpload: true
	});
});

router.get('/geo', function(req, res) {
	var METERS_PER_MILE = 1609.34;
	User.find({
		'profile.address.coordinates': {
			$near: {
				$geometry: {
					"type": "Point",
					"coordinates": [-84.4191529,
						34.02818
					]
				},
				$maxDistance: 5 * METERS_PER_MILE
			}
		}
	}, function(err, list) {
		if (err) {
			throw err;
		} else {
			console.log(list);
			res.json(list);
		}
	})
});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		if (req.user.profile.address.city) {
			res.redirect('/user/' + (req.user.profile.username).toLowerCase());
		} else {
			if (req.user.facebook.id) {
				res.redirect('/signup/new/facebook');
			} else if (req.user.profile.account_type == "Student") {
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
			return next();
		} else {
			if (req.user.facebook.id) {
				res.redirect('/signup/new/facebook');
			} else if (req.user.profile.account_type == "Student") {
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

router.get('/signup/new/facebook', infoFilledOut, function(req, res) {
	res.render('signup-new-facebook', {
		error_msg: req.flash('error_msg'),
		email: req.user.local.email
	});
});

router.get('/signup/new/facebook/student', infoFilledOut, function(req, res) {
	res.render('signup-new-facebook-student', {
		error_msg: req.flash('error_msg')
	});
});

router.get('/signup/new/facebook/parent', infoFilledOut, function(req, res) {
	res.render('signup-new-facebook-parent', {
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

const S3_BUCKET = 'hs-impact';

router.post('/sign-s3', ensureAuthenticated, (req, res) => {
	const s3 = new aws.S3();
	const fileName = req.user.profile.username + '.jpg';
	const fileType = 'image/jpeg';
	const s3Params = {
		Bucket: S3_BUCKET,
		Key: fileName,
		Expires: 60,
		ContentType: fileType,
		ACL: 'public-read'
	};

	s3.getSignedUrl('putObject', s3Params, (err, data) => {
		if (err) {
			console.log(err);
			return res.end();
		}
		const returnData = {
			signedRequest: data,
			url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
		};
		res.write(JSON.stringify(returnData));
		res.end();
	});
});

router.post('/account/picture', ensureAuthenticated, function(req, res) {
	User.findById(req.user.id, function(err, user) {
		if (err) {
			throw err;
		} else {
			user.profile.image = true;
			user.save(function(err) {
				if (err) {
					throw err;
				} else {
					res.json({
						changed: true
					});
				}
			})
		}
	})
})

router.get('/account/settings', ensureAuthenticated, function(req, res) {
	if (req.user.local.password) {
		var hasLocalLogin = true;
	} else {
		var hasLocalLogin = false;
	}
	res.render('account-settings', {
		email: req.user.local.email,
		email_verified: req.user.local.verification.email.verified,
		phone: req.user.local.phone,
		phone_verified: req.user.local.verification.phone.verified,
		success_msg: req.flash('success_msg'),
		hasLocalLogin: hasLocalLogin
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

router.get('/account/verify/phone', ensureAuthenticated, function(req, res) {
	if (req.user.local.verification.phone.verified == true) {
		res.redirect('/user/' + (req.user.profile.username).toLowerCase());
	} else if (req.user.local.verification.phone.code) {
		res.redirect('/account/verify/phone/code');
	} else {
		res.render('account-verify-phone', {
			phone: req.user.local.phone
		});
	}
});

router.get('/account/verify/phone/code', ensureAuthenticated, function(req, res) {
	if (req.user.local.verification.phone.verified == true) {
		res.redirect('/user/' + (req.user.profile.username).toLowerCase());
	} else if (req.user.local.verification.phone.code) {
		res.render('account-verify-phone-code', {
			phone: req.user.local.phone,
			error_msg: req.flash('error_msg')
		});
	} else {
		res.redirect('/account/verify/phone');
	}
});

router.get('/account/verify/phone/resend', ensureAuthenticated, function(req, res) {
	if (req.user.local.verification.phone.verified == true) {
		res.redirect('/user/' + (req.user.profile.username).toLowerCase());
	} else {
		User.findById(req.user.id, function(err, user) {
			if (err) {
				throw err;
			} else {
				user.local.verification.phone.code = undefined;
				user.save(function(err) {
					if (err) {
						throw err;
					} else {
						res.redirect('/account/verify/phone');
					}
				})
			}
		})
	}
});

router.get('/account/verify/email', ensureAuthenticated, function(req, res) {
	if (req.user.local.verification.email.verified == true) {
		res.redirect('/user/' + (req.user.profile.username).toLowerCase());
	} else if (req.user.local.verification.email.code) {
		res.redirect('/account/verify/email/code');
	} else {
		res.render('account-verify-email', {
			email: req.user.local.email
		});
	}
});

router.get('/account/verify/email/code', ensureAuthenticated, function(req, res) {
	if (req.user.local.verification.email.verified == true) {
		res.redirect('/user/' + (req.user.profile.username).toLowerCase());
	} else if (req.user.local.verification.email.code) {
		res.render('account-verify-email-code', {
			email: req.user.local.email,
			error_msg: req.flash('error_msg')
		});
	} else {
		res.redirect('/account/verify/email');
	}
});

// post /account/verify/email/code from email link
router.get('/account/verify/email/code/:code', function(req, res) {
	if (req.user.local.verification.email.verified == true) {
		res.redirect('/user/' + (req.user.profile.username).toLowerCase());
	} else {
		User.findById(req.user.id, function(err, user) {
			if (err) {
				throw err;
			} else {
				if (req.params.code == user.local.verification.email.code) {
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
	}
});

router.get('/account/verify/email/resend', ensureAuthenticated, function(req, res) {
	if (req.user.local.verification.email.verified == true) {
		res.redirect('/user/' + (req.user.profile.username).toLowerCase());
	} else {
		User.findById(req.user.id, function(err, user) {
			if (err) {
				throw err;
			} else {
				user.local.verification.email.code = undefined;
				user.save(function(err) {
					if (err) {
						throw err;
					} else {
						res.redirect('/account/verify/email');
					}
				})
			}
		})
	}
});


router.get('/explore', ensureAuthenticated, function(req, res) {
	/*Job.find().limit(10).toArray(function(err, jobs) {
		if (err) {
			console.log(err);
		} else {
			res.render('explore', {
				jobs: jobs
			});
		}
	})*/
	Job.find({}).limit(10).exec(function(err, jobs) {
		if (err) {
			console.log(err);
		} else {
			res.render('explore', {
				jobs: jobs
			});
		}
	})
});

router.get('/post', ensureAuthenticated, function(req, res) {
	res.render('post');
});

router.post('/post/new', ensureAuthenticated, function(req, res) {
	// create the job
	var newJob = new Job();

	newJob.creator = req.user._id;
	newJob.title = req.body.title;
	newJob.date = req.body.date;
	newJob.time.start = req.body.start_time;
	newJob.time.end = req.body.end_time;
	newJob.location = req.user.profile.address.city + ', ' + req.user.profile.address.state + ' ' + req.user.profile.address.zip;
	newJob.description = req.body.description;
	newJob.pay = req.body.pay;
	newJob.children = req.body.children;

	newJob.save(function(err) {
		if (err) {
			console.log(err);
		}
		res.redirect('/user/' + (req.user.profile.username).toLowerCase());
	});
})
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
		var newJob = new User({
			name: name,
			email: email,
			username: username,
			password: password
		});

		User.createUser(newJob, function(err, user) {
			if (err) throw err;
			console.log(user);
		});

		req.flash('success_msg', 'You are registered and can now login');

		res.redirect('/users/login');
	}
});*/