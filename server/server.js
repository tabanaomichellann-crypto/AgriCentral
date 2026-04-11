const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/api/images', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/auth',  require('./src/routes/auth.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api',       require('./src/routes/farmer.routes'));
app.use('/api/equipment', require('./src/routes/equipment.routes'));
app.use('/api/equipment-requests', require('./src/routes/equipmentRequest.routes'));
app.use('/api/equipment-condition-logs', require('./src/routes/conditionLog.routes'));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});