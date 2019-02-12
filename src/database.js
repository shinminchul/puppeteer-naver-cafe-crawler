const { Schema, model } = require('mongoose');
const mongoose = require('mongoose');
const { database } = require('../config/config');
const appLogger = require('./util').getLogger('APP');

// Database connection
mongoose.connect(
  `${database.host}:${database.port}`,
  {
    user: database.username,
    pass: database.password,
    dbName: database.dbName,
    useNewUrlParser: true,
  },
  (error) => {
    if (error) {
      appLogger.error(error);
    } else {
      appLogger.info('The database is successfully connected!');
    }
  },
);

// Model
const cafeSchema = new Schema({
  property: { type: Number, default: 0 },
  title: { type: String, required: true },
  images: [String],
  contact: String,
  addresses: { type: [String], required: true },
  location: Object,
  openingHours: [Object],
  menus: [Object],
  homepage: String,
  convenience: String,
  description: String,
  tagId: { type: Schema.Types.ObjectId, ref: 'Tags' },
});

module.exports = model('newCafe', cafeSchema);
