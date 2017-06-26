var express = require('express');
var router = express.Router();
var passport = require('passport');

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
			console.log('info: ' + info.error_msg);
			req.flash('error_msg', info.error_msg);
			return res.redirect('/login');
		}
		req.logIn(user, function(err) {
			if (err) {
				return next(err);
			}
			req.session.save(() => { // Explicitly save the session before redirecting!
				res.redirect('/profile');
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
				res.redirect('/profile');
			})
		});
	})(req, res, next);
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