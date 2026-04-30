// backend/cleanup-duplicate-notifications.js
// Run this once to remove duplicate payment notifications

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupDuplicates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const Notification = require('./models/notification');

    // Find all payment success notifications
    const notifications = await Notification.find({
      type: 'order_payment_success'
    }).sort({ created_at: 1 }); // Oldest first

    console.log(`📊 Found ${notifications.length} payment notifications\n`);

    // Group by user_id and link
    const groups = {};
    notifications.forEach(notif => {
      const key = `${notif.user_id}-${notif.link}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notif);
    });

    // Find duplicates
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;

    for (const [key, notifs] of Object.entries(groups)) {
      if (notifs.length > 1) {
        duplicatesFound += notifs.length - 1;
        console.log(`🔍 Found ${notifs.length} duplicates for ${key}`);
        
        // Keep the first one, remove the rest
        const toKeep = notifs[0];
        const toRemove = notifs.slice(1);
        
        console.log(`   ✅ Keeping: ${toKeep._id} (${toKeep.created_at})`);
        
        for (const dup of toRemove) {
          console.log(`   ❌ Removing: ${dup._id} (${dup.created_at})`);
          await Notification.findByIdAndDelete(dup._id);
          duplicatesRemoved++;
        }
        console.log('');
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total notifications: ${notifications.length}`);
    console.log(`   Duplicates found: ${duplicatesFound}`);
    console.log(`   Duplicates removed: ${duplicatesRemoved}`);
    console.log(`   Remaining: ${notifications.length - duplicatesRemoved}\n`);

    console.log('✅ Cleanup complete!\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
