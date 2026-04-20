const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  roll: String,
  dept: String,
  year: String,
  total_classes: { type: Number, default: 0 },
  attended_classes: { type: Number, default: 0 }
});

module.exports = mongoose.model('Student', studentSchema);