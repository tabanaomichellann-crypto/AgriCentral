const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User.model'); 
require('dotenv').config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('Connected to MongoDB...');

    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('Admin account already exists. Skipping.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash('Admin@1234', 10);

    await User.create({
      fullName:     'System Administrator',
      username:     'admin',
      passwordHash,
      email:        'admin@agricentral.com',
      role:         'Admin',
      status:       'Active',
    });

    console.log('✅ Admin account created successfully!');
    console.log('   Username : admin');
    console.log('   Password : Admin@123');
    console.log('   ⚠️  Change the password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder failed:', err.message);
    process.exit(1);
  }
}

seedAdmin();