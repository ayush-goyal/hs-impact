// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
// load up the user model
var User = require('../models/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

	//Local Login
	passport.use('local-login', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	}, function(req, email, password, done) {
		process.nextTick(function() { // asynchronous
			User.findOne({
				'email': email
			}, function(err, user) {
				// if there are any errors, return the error
				if (err) {
					return done(err);
				}
				// if no user is found, return the message
				if (!user || !user.validPassword(password)) {
					return done(null, false, {
						'error_msg': 'Invalid email or password'
					});
				} else { // all is well, return user
					console.log('here');
					return done(null, user);
				}
			});
		});
	}));

	//Local Signup
	passport.use('local-signup', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
	}, function(req, email, password, done) {
		// asynchronous
		process.nextTick(function() {
			// if the user is not already logged in:
			console.log('asdfsdfdf');
			if (!req.user) {
				User.findOne({
					'email': email
				}, function(err, user) {
					// if there are any errors, return the error
					if (err) {
						return done(err);
					}
					console.log('asdfsdfsdf');
					// check to see if theres already a user with that email
					if (user) {
						console.log('email taken');
						return done(null, false, {
							'error_msg': 'That email is already taken.'
						});
					} else {

						// create the user
						var newUser = new User();

						newUser.email = email;
						newUser.name.first = req.body.firstName;
						newUser.name.last = req.body.lastName;
						newUser.local.password = newUser.generateHash(password);

						newUser.save(function(err) {
							if (err) {
								return done(err);
							}
							console.log('sadf');
							return done(null, newUser);
						});
					}
				});
				// if the user is logged in but has no local account...
			} else if (!req.user.local.email) {
				// ...presumably they're trying to connect a local account
				// BUT let's check if the email used to connect a local account is being used by another user
				User.findOne({
					'local.email': email
				}, function(err, user) {
					if (err) {
						return done(err);
					}

					if (user) {
						return done(null, false, {
							'error_msg': 'That email is already taken.'
						});
						// Using 'loginMessage instead of signupMessage because it's used by /connect/local'
					} else {
						var user = req.user;
						user.email = email;
						newUser.name.first = req.body.firstName;
						newUser.name.last = req.body.lastName;
						user.local.password = user.generateHash(password);
						user.save(function(err) {
							if (err) {
								return done(err);
							}

							return done(null, user);
						});
					}
				});
			} else {
				// user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
				return done(null, req.user);
			}
		});
	}));

	passport.use(new FacebookStrategy({
		clientID: process.env.HSIMPACT_FACEBOOK_APP_ID,
		clientSecret: process.env.HSIMPACT_FACEBOOK_APP_SECRET,
		callbackURL: "https://hs-impact.herokuapp.com/auth/facebook/return",
		profileFields: ['id', 'displayName', 'email'],
		passReqToCallback: true
	}, function(req, accessToken, refreshToken, profile, done) {
		// asynchronous verification, for effect...
		process.nextTick(function() {
			// check if the user is already logged in
			/*			console.log(profile);
						console.log("token: " + accessToken);
						console.dir(req);
						console.log("refreshtoken: " + refreshToken)*/
			if (!req.user) {
				console.log('hello');
				User.findOne({
					'facebook.id': profile.id
				}, function(err, user) {
					console.log('hello3');
					if (err) {
						console.log(err);
						return done(err);
					}
					console.log('hello4');
					if (user) {
						console.log('hello5');
						// if there is a user id already but no token (user was linked at one point and then removed)
						if (!user.facebook.token) {
							console.log('hello6');
							user.facebook.token = accessToken;
							if (profile.name.givenName && profile.name.familyName) {
								user.name.first = profile.name.givenName;
								user.name.last = profile.name.familyName;
							} else if (profile.displayName) {
								user.name.first = profile.displayName;
								user.name.last = ' ';
							} else if (profile.username) {
								user.name.first = profile.username;
								user.name.last = ' ';
							} else {
								var err = new Error('Facebook profile does not provide a valid name. Please create an account.');
								err.status = 400;
								return done(err);
							}
							if (profile.emails[0].value) {
								user.email = (profile.emails[0].value || '').toLowerCase();
							} else {
								var err = new Error('Facebook profile does not provide a valid email. Please create an account.');
								err.status = 400;
								return done(err);
							}
							console.log('hello7');
							user.save(function(err) {
								if (err) {
									console.error(err);
									console.log('helleorj0');
									return done(err);
								}
								console.log('helleorj0234');
								return done(null, user);
							});
						}

						return done(null, user); // user found, return that user
					} else {
						// if there is no user, create them
						console.log('hello2');
						var newUser = new User();

						newUser.facebook.id = profile.id;
						newUser.facebook.token = accessToken;
						if (profile.name.givenName && profile.name.familyName) {
							newUser.name.first = profile.name.givenName;
							newUser.name.last = profile.name.familyName;
						} else if (profile.displayName) {
							newUser.name.first = profile.displayName;
							newUser.name.last = ' ';
						} else if (profile.username) {
							newUser.name.first = profile.username;
							newUser.name.last = ' ';
						} else {
							var err = new Error('Facebook profile does not provide a valid name. Please create an account.');
							err.status = 400;
							return done(err);
						}
						if (profile.emails[0].value) {
							newUser.email = (profile.emails[0].value || '').toLowerCase();
						} else {
							var err = new Error('Facebook profile does not provide a valid email. Please create an account.');
							err.status = 400;
							return done(err);
						}
						console.log('helleorj02dsf34');
						newUser.save(function(err) {
							if (err) {
								console.log(err);
								return done(err);
							}
							console.log('helleorj0234sdfdsf');
							return done(null, newUser);
						});
					}
				});

			} else {
				// user already exists and is logged in, we have to link accounts
				var user = req.user; // pull the user out of the session

				user.facebook.id = profile.id;
				user.facebook.token = accessToken;
				if (profile.name.givenName && profile.name.familyName) {
					user.name.first = profile.name.givenName;
					user.name.last = profile.name.familyName;
				} else if (profile.displayName) {
					user.name.first = profile.displayName;
					user.name.last = ' ';
				} else if (profile.username) {
					user.name.first = profile.username;
					user.name.last = ' ';
				} else {
					var err = new Error('Facebook profile does not provide a valid name. Please create an account.');
					err.status = 400;
					return done(err);
				}
				if (profile.emails[0].value) {
					user.email = (profile.emails[0].value || '').toLowerCase();
				} else {
					var err = new Error('Facebook profile does not provide a valid email. Please create an account.');
					err.status = 400;
					return done(err);
				}

				user.save(function(err) {
					if (err) {
						console.log(err);
						return done(err);
					}

					return done(null, user);
				});

			}
		})
	}));

	// passport session setup
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});

	// used to deserialize the user
	passport.deserializeUser(function(userId, done) {
		User.findById(userId, function(err, user) {
			done(err, user);
		});
	});
};