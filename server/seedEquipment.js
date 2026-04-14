const mongoose = require('mongoose');
const path = require('path');
const Equipment = require('./src/models/equipment.model');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const CLOUD_MONGO_URI = process.env.MONGO_URI;
const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/agricentral';

const equipmentSeed = [
  { equipment_name: 'John Deere 5075E', category: 'Tractor', quantity_total: 6, quantity_available: 6, status: 'Available' },
  { equipment_name: 'Kubota L4018', category: 'Tractor', quantity_total: 5, quantity_available: 5, status: 'Available' },
  { equipment_name: 'Yanmar YM347A', category: 'Hand Tractor', quantity_total: 8, quantity_available: 8, status: 'Available' },
  { equipment_name: 'Honda GX160 Water Pump', category: 'Water Pump', quantity_total: 12, quantity_available: 12, status: 'Available' },
  { equipment_name: 'Koshin SEV-25L Sprayer', category: 'Sprayer', quantity_total: 15, quantity_available: 15, status: 'Available' },
  { equipment_name: 'Rice Transplanter AP4', category: 'Transplanter', quantity_total: 7, quantity_available: 7, status: 'Available' },
  { equipment_name: 'Yanmar AW70V Harvester', category: 'Harvester', quantity_total: 4, quantity_available: 4, status: 'Available' },
  { equipment_name: 'CLAAS Crop Tiger 40', category: 'Combine Harvester', quantity_total: 3, quantity_available: 3, status: 'Available' },
  { equipment_name: 'Satake RM120 Rice Mill', category: 'Rice Mill', quantity_total: 6, quantity_available: 6, status: 'Available' },
  { equipment_name: 'AgriPro 6FT Thresher', category: 'Thresher', quantity_total: 10, quantity_available: 10, status: 'Available' },
  { equipment_name: 'SeedMaster 300', category: 'Seed Drill', quantity_total: 9, quantity_available: 9, status: 'Available' },
  { equipment_name: 'Field Roller Pro', category: 'Other', quantity_total: 5, quantity_available: 5, status: 'Available' }
];

async function seedEquipment() {
  try {
    let connectedUri = null;

    if (CLOUD_MONGO_URI) {
      try {
        await mongoose.connect(CLOUD_MONGO_URI, { family: 4, serverSelectionTimeoutMS: 5000 });
        connectedUri = 'cloud';
      } catch {
        await mongoose.connect(LOCAL_MONGO_URI, { family: 4, serverSelectionTimeoutMS: 5000 });
        connectedUri = 'local-fallback';
      }
    } else {
      await mongoose.connect(LOCAL_MONGO_URI, { family: 4, serverSelectionTimeoutMS: 5000 });
      connectedUri = 'local';
    }

    console.log(`Connected to MongoDB (${connectedUri})`);

    let inserted = 0;
    let updated = 0;

    for (const item of equipmentSeed) {
      const existing = await Equipment.findOne({ equipment_name: item.equipment_name });

      if (existing) {
        await Equipment.updateOne(
          { _id: existing._id },
          {
            $set: {
              category: item.category,
              status: item.status,
              quantity_total: item.quantity_total,
              quantity_available: item.quantity_available
            }
          }
        );
        updated += 1;
      } else {
        await Equipment.create(item);
        inserted += 1;
      }
    }

    console.log('Equipment seeding complete');
    console.log(`Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error('Equipment seeding failed:', err.message);
    process.exit(1);
  }
}

seedEquipment();
