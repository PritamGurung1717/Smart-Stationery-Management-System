// backend/create-notification-index.js
// Manually create the unique index for notifications

const mongoose = require('mongoose');
require('dotenv').config();

async function createIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const Notification = require('./models/notification');
    
    console.log('📝 Creating unique index on notifications...\n');
    
    // Drop existing index if it exists (to recreate it properly)
    try {
      await Notification.collection.dropIndex('user_id_1_type_1_link_1');
      console.log('🗑️  Dropped existing index\n');
    } catch (err) {
      console.log('ℹ️  No existing index to drop\n');
    }
    
    // Create the unique index with simpler filter
    await Notification.collection.createIndex(
      { user_id: 1, type: 1, link: 1 },
      {
        unique: true,
        partialFilterExpression: {
          type: 'order_payment_success',
          link: { $exists: true }
        },
        name: 'unique_payment_notification'
      }
    );
    
    console.log('✅ Unique index created successfully!\n');
    
    // Verify the index
    const indexes = await Notification.collection.indexes();
    console.log('📊 Current indexes:');
    indexes.forEach(index => {
      console.log(`   - ${index.name}:`, JSON.stringify(index.key));
      if (index.unique) {
        console.log('     ✅ UNIQUE');
      }
      if (index.partialFilterExpression) {
        console.log('     🔍 Partial:', JSON.stringify(index.partialFilterExpression));
      }
    });
    
    console.log('\n✅ Index setup complete!\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createIndex();
