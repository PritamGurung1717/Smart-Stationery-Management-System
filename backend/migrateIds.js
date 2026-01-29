const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-stationery', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('./models/user');
const Product = require('./models/product');
const Order = require('./models/order');
const Category = require('./models/category');
const Counter = require('./models/counter');

async function migrateAllIds() {
  console.log('Starting migration...');
  
  try {
    // Reset counters to 1
    await Counter.deleteMany({});
    
    // Migrate Users
    const users = await User.find({ id: { $exists: false } });
    console.log(`Found ${users.length} users without ID`);
    
    for (let i = 0; i < users.length; i++) {
      users[i].id = i + 1;
      await users[i].save();
      console.log(`User ${users[i].email} → ID: ${users[i].id}`);
    }
    
    // Update user counter
    await Counter.findByIdAndUpdate(
      { _id: 'userId' },
      { sequence_value: users.length + 1 },
      { upsert: true }
    );
    
    // Migrate Products
    const products = await Product.find({ id: { $exists: false } });
    console.log(`\nFound ${products.length} products without ID`);
    
    for (let i = 0; i < products.length; i++) {
      products[i].id = i + 1;
      await products[i].save();
      console.log(`Product ${products[i].name} → ID: ${products[i].id}`);
    }
    
    // Update product counter
    await Counter.findByIdAndUpdate(
      { _id: 'productId' },
      { sequence_value: products.length + 1 },
      { upsert: true }
    );
    
    // Migrate Orders
    const orders = await Order.find({ id: { $exists: false } });
    console.log(`\nFound ${orders.length} orders without ID`);
    
    for (let i = 0; i < orders.length; i++) {
      orders[i].id = i + 1;
      await orders[i].save();
      console.log(`Order → ID: ${orders[i].id}`);
    }
    
    // Update order counter
    await Counter.findByIdAndUpdate(
      { _id: 'orderId' },
      { sequence_value: orders.length + 1 },
      { upsert: true }
    );
    
    // Migrate Categories
    const categories = await Category.find({ id: { $exists: false } });
    console.log(`\nFound ${categories.length} categories without ID`);
    
    for (let i = 0; i < categories.length; i++) {
      categories[i].id = i + 1;
      await categories[i].save();
      console.log(`Category ${categories[i].name} → ID: ${categories[i].id}`);
    }
    
    // Update category counter
    await Counter.findByIdAndUpdate(
      { _id: 'categoryId' },
      { sequence_value: categories.length + 1 },
      { upsert: true }
    );
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run migration
migrateAllIds();