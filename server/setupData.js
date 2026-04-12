const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User.model');
const Farmer = require('./src/models/Farmer.model');
const Association = require('./src/models/Association.model');
require('dotenv').config();

async function setup() {
  try {
    // Connect with shorter timeout
    const mongoUri = 'mongodb://127.0.0.1:27017/agricentral';
    await mongoose.connect(mongoUri, { family: 4, serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to MongoDB');

    // Create or get coordinator user
    const coordHash = await bcrypt.hash('Coordinator@1234', 10);
    const coordinator = await User.findOneAndUpdate(
      { username: 'coordinator' },
      {
        fullName: 'Maria Santos',
        username: 'coordinator',
        passwordHash: coordHash,
        email: 'coordinator@agricentral.com',
        role: 'Program Coordinator',
        status: 'Active',
      },
      { upsert: true, new: true }
    );
    console.log('✅ Coordinator account created/updated');

    // Create association
    const assoc = await Association.findOneAndUpdate(
      { agencyCode: 'ASSOC-001' },
      {
        agencyCode: 'ASSOC-001',
        associationName: 'San Jose Farmers Cooperative',
        region: 'Region III',
        province: 'Bulacan',
        municipality: 'San Jose',
        barangay: 'Tuktukan',
        presidentName: 'Juan Dela Cruz',
        contactNumber: '09123456789',
        memberCount: 45,
      },
      { upsert: true, new: true }
    );
    console.log('✅ Association created/updated');

    // Clear old demo farmers
    await Farmer.deleteMany({ rsbaNumber: { $regex: '^DEMO-' } });

    // Create farmers
    const farmers = await Farmer.create([
      {
        rsbaNumber: 'DEMO-001',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        contactNumber: '09123456789',
        address: 'Sitio Laya, San Jose, Bulacan',
        proofOfOwnershipType: 'Ownership',
        validIdRef: 'Driver\'s License - ABC123456',
      },
      {
        rsbaNumber: 'DEMO-002',
        firstName: 'Maria',
        lastName: 'Santos',
        contactNumber: '09198765432',
        address: 'Barangay Tuktukan, San Jose, Bulacan',
        proofOfOwnershipType: 'Tenancy',
        validIdRef: 'Voter\'s ID - XYZ789012',
      },
      {
        rsbaNumber: 'DEMO-003',
        firstName: 'Pedro',
        lastName: 'Reyes',
        contactNumber: '09156789012',
        address: 'Barangay Paluming, San Jose, Bulacan',
        proofOfOwnershipType: 'Agreement',
        validIdRef: 'PRC ID - DEF345678',
      },
    ]);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ SETUP COMPLETED!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n📊 Created:');
    console.log(`   • 1 Coordinator account`);
    console.log(`   • 1 Association`);
    console.log(`   • ${farmers.length} Farmers`);
    console.log('\n🔐 Login as Coordinator:');
    console.log('   Username: coordinator');
    console.log('   Password: Coordinator@1234');
    console.log('\n💡 Refresh your browser and login to see the farmers!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
}

setup();
