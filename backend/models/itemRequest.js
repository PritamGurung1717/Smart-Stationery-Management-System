// backend/models/itemRequest.js
const mongoose = require('mongoose');
const Counter = require('./counter');

const itemRequestSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  user_id: { type: Number, required: true, index: true },
  item_name: { type: String, required: true, trim: true, minlength: 3 },
  category: {
    type: String,
    required: true,
    enum: ['book', 'stationery', 'electronics', 'sports', 'other']
  },
  description: { type: String, trim: true, default: '' },
  quantity_requested: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  admin_remark: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: false });

itemRequestSchema.index({ user_id: 1, status: 1 });
itemRequestSchema.index({ status: 1, created_at: -1 });

itemRequestSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      'item_request_id',
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    this.id = counter.sequence_value;
  }
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('ItemRequest', itemRequestSchema);
