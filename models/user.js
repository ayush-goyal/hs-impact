var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

// User Schema
var UserSchema = mongoose.Schema({
	name: {
		first: {
			type: String,
		},
		last: {
			type: String,
		}
	},
	email: {
		type: String,
	},
	local: {
		password: {
			type: String,
		}
	},
	facebook: {
		id: {
			type: String,
		},
		token: {
			type: String,
		}
	}
});




// generating a hash
UserSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
};

var User = mongoose.model('User', UserSchema);
module.exports = User;

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

/*// get user by user id
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
}*/
/*
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
});*/