var mongoose = require('mongoose');
const user = require('./user');

var EntrySchema = new mongoose.Schema({
	title: String,
	desc: String,
	date: Date,
	User: String,
});

module.exports = mongoose.model('Entry', EntrySchema);
