// Fix admin user ID
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user');
const Counter = require('./models/counter');

async function fixAdminId() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-stationery');
    console.log('✅ Connected to MongoDB');

    // Find admin user without id field
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('Found admin:', admin.email);
    console.log('Current id:', admin.id);
    console.log('Current _id:', admin._id);

    if (!admin.id) {
      // Get next available ID from counter
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'userId' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      
      admin.id = counter.sequence_value;
      
      // Bypass validation by using updateOne directly
      await User.updateOne(
        { _id: admin._id },
        { $set: { id: admin.id } }
      );
      
      console.log('✅ Admin ID set to:', admin.id);
    } else {
      console.log('✅ Admin already has ID:', admin.id);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAdminId();
