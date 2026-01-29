const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-stationery');

const User = require('./models/user');
const Product = require('./models/product');
const Order = require('./models/order');
const Category = require('./models/category');
const Counter = require('./models/counter');

async function migrateAll() {
  console.log('=== COMPLETE DATA MIGRATION ===\n');
  
  try {
    // 1. Reset counters
    await Counter.deleteMany({});
    console.log('🗑️  Counters reset\n');
    
    // 2. Migrate Users
    console.log('👤 Migrating Users...');
    const users = await User.find();
    for (let i = 0; i < users.length; i++) {
      users[i].id = i + 1;
      await users[i].save();
      console.log(`   User ${users[i].email} → ID: ${users[i].id}`);
    }
    await new Counter({ _id: 'userId', sequence_value: users.length + 1 }).save();
    
    // 3. Migrate Products
    console.log('\n🛍️  Migrating Products...');
    const products = await Product.find();
    for (let i = 0; i < products.length; i++) {
      products[i].id = i + 1;
      await products[i].save();
      console.log(`   Product ${products[i].name} → ID: ${products[i].id}`);
    }
    await new Counter({ _id: 'productId', sequence_value: products.length + 1 }).save();
    
    // 4. Migrate Categories
    console.log('\n📁 Migrating Categories...');
    const categories = await Category.find();
    for (let i = 0; i < categories.length; i++) {
      categories[i].id = i + 1;
      await categories[i].save();
      console.log(`   Category ${categories[i].name} → ID: ${categories[i].id}`);
    }
    await new Counter({ _id: 'categoryId', sequence_value: categories.length + 1 }).save();
    
    // 5. Migrate Orders (with references)
    console.log('\n📦 Migrating Orders...');
    const orders = await Order.find();
    for (let i = 0; i < orders.length; i++) {
      orders[i].id = i + 1;
      
      // Update user reference
      const user = await User.findById(orders[i].user);
      if (user && user.id) orders[i].user = user.id;
      
      // Update institute reference
      if (orders[i].institute) {
        const institute = await User.findById(orders[i].institute);
        if (institute && institute.id) orders[i].institute = institute.id;
      }
      
      // Update product references
      for (const item of orders[i].products) {
        const product = await Product.findById(item.product);
        if (product && product.id) {
          item.product = product.id;
          item.productId = product.id;
        }
      }
      
      await orders[i].save();
      console.log(`   Order ${i+1} → ID: ${orders[i].id}, User: ${orders[i].user}`);
    }
    await new Counter({ _id: 'orderId', sequence_value: orders.length + 1 }).save();
    
    // 6. Migrate User Carts
    console.log('\n🛒 Migrating User Carts...');
    const usersWithCart = await User.find({ 'cart': { $exists: true } });
    for (const user of usersWithCart) {
      if (user.cart) {
        user.cart.user = user.id;
        
        for (const item of user.cart.items || []) {
          const product = await Product.findById(item.product);
          if (product && product.id) {
            item.product = product.id;
          }
        }
        
        await user.save();
        console.log(`   Cart for ${user.email} migrated`);
      }
    }
    
    console.log('\n✅ ✅ ✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Orders: ${orders.length}`);
    console.log(`   Carts: ${usersWithCart.length}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run complete migration
migrateAll();