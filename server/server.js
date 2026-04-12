const dns = require('node:dns').promises;
dns.setServers(['1.1.1.1', '8.8.8.8']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/api/images', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agricentral';

if (!process.env.MONGO_URI) {
  console.warn('Warning: MONGO_URI not defined in .env; using local fallback.');
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth',  require('./src/routes/auth.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api',       require('./src/routes/farmer.routes'));
app.use('/api/equipment', require('./src/routes/equipment.routes'));
app.use('/api/equipment-requests', require('./src/routes/equipmentRequest.routes'));
app.use('/api/equipment-condition-logs', require('./src/routes/conditionLog.routes'));
app.use('/api', require('./src/routes/crops.routes'));
app.use('/api/farmer-crops', require('./src/routes/farmerCrop.routes'));
app.use('/api/crop-damages', require('./src/routes/cropDamage.routes'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});