var mongoose = require('mongoose');

var JobSchema = mongoose.Schema({
	creator: {
		name: String,
		username: String,
		image: Boolean
	},
	title: String,
	description: String,
	date: String,
	time: {
		start: String,
		end: String
	},
	location: String,
	pay: String,
	children: Number
})

var Job = mongoose.model('Job', JobSchema);
module.exports = Job;