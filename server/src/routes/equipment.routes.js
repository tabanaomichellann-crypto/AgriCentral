const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

// Equipment routes
router.get('/', equipmentController.getEquipment);
router.post('/', upload.single('image'), equipmentController.createEquipment);
router.put('/:id', upload.single('image'), equipmentController.updateEquipment);
router.delete('/:id', equipmentController.deleteEquipment);

module.exports = router;