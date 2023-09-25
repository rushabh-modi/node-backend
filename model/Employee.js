const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Employee', employeeSchema);
