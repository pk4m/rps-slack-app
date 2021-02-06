const mongoose = require('mongoose');

module.exports = mongoose.model('OAuth', new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  installation: {
    type: mongoose.Schema.Types.Mixed
  }
}));
