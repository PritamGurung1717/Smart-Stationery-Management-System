// backend/models/counter.js
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 1 }
});

module.exports = mongoose.model("Counter", counterSchema);