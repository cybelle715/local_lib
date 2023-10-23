const mongoose = require('mongoose');

// define schema

const Schema = mongoose.Schema;

const SomeModelSchema = new Schema({
  a_string: String,
  a_date: Date,
});

// create model

module.exports = mongoose.model('SomeModel', SomeModelSchema);
