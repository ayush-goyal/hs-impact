var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

// User Schema
var UserSchema = mongoose.Schema({
	name: {
		first: {
			type: String,
			required: true,
			trim: true
		},
		last: {
			type: String,
			required: true,
			trim: true
		}
	},
	email: {
		type: String,
		unique: true,
		required: true,
		trim: true
	},
	password: {
		type: String,
		required: true
	}
});

// authenticate input against database documents
UserSchema.statics.authenticate = function(email, password, callback) {
	User.findOne({
		email: email
	}).exec(function(error, user) {
		if (error) {
			return callback(error);
		} else if (!user) {
			var err = new Error('User not found.');
			err.status = 401;
			return callback(err);
		}
		bcrypt.compare(password, user.password, function(error, result) {
			if (result === true) {
				return callback(null, user);
			} else {
				return callback();
			}
		})
	});
}

/*// get user by username
UserSchema.statics.getUserByUsername = function(username, callback) {
	User.findOne({
		username: username
	}).exec(function(error, user) {
		if (error) {
			return callback(error)
		} else if (!user) {
			var err = new Error('User not found.');
			err.status = 404;
			return callback(error);
		} else {
			return user
		}
	})
}*/

// get user by user id
UserSchema.statics.getUserById = function(id, callback) {
	User.findOne({
		_id: id
	}).exec(function(error, user) {
		if (error) {
			return callback(error)
		} else if (!user) {
			var err = new Error('User not found.');
			err.status = 404;
			return callback(error);
		} else {
			return user
		}
	})
}

// hash password before saving to database
UserSchema.pre('save', function(next) {
	var user = this;
	bcrypt.hash(user.password, 10, function(err, hash) {
		if (err) {
			return next(err);
		}
		user.password = hash;
		next();
	})
});

var User = mongoose.model('User', UserSchema);
module.exports = User;