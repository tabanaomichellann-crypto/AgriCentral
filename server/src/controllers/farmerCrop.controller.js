const FarmerCrop = require('../models/FarmerCrop.model');
const Farmer = require('../models/Farmer.model');
const Crop = require('../models/Crop.model');

// Get all farmer-crop relationships
exports.getFarmerCrops = async (req, res) => {
  try {
    const farmerCrops = await FarmerCrop.find()
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber address')
      .populate('cropId', 'name scientificName')
      .sort({ plantingDate: -1 });
    res.json(farmerCrops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get farmers for a specific crop
exports.getFarmersByCrop = async (req, res) => {
  try {
    const cropId = req.params.cropId;
    const farmerCrops = await FarmerCrop.find({ cropId })
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber address')
      .populate('cropId', 'name scientificName')
      .sort({ plantingDate: -1 });

    res.json(farmerCrops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get crops planted by a specific farmer
exports.getCropsByFarmer = async (req, res) => {
  try {
    const farmerId = req.params.farmerId;
    const farmerCrops = await FarmerCrop.find({ farmerId })
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber address')
      .populate('cropId', 'name scientificName description')
      .sort({ plantingDate: -1 });

    res.json(farmerCrops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign a crop to a farmer
exports.assignCropToFarmer = async (req, res) => {
  try {
    const { farmerId, cropId, plantingDate, expectedHarvestDate, areaPlanted, notes } = req.body;

    // Check if farmer exists
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }

    // Check if crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found.' });
    }

    // Check if relationship already exists
    const existing = await FarmerCrop.findOne({ farmerId, cropId });
    if (existing) {
      return res.status(400).json({ message: 'This farmer already plants this crop.' });
    }

    const farmerCrop = await FarmerCrop.create({
      farmerId,
      cropId,
      plantingDate: plantingDate || new Date(),
      expectedHarvestDate,
      areaPlanted,
      notes
    });

    const populatedFarmerCrop = await FarmerCrop.findById(farmerCrop._id)
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber address')
      .populate('cropId', 'name scientificName');

    res.status(201).json(populatedFarmerCrop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update farmer-crop relationship
exports.updateFarmerCrop = async (req, res) => {
  try {
    const { plantingDate, expectedHarvestDate, areaPlanted, status, notes } = req.body;

    const farmerCrop = await FarmerCrop.findByIdAndUpdate(
      req.params.id,
      { plantingDate, expectedHarvestDate, areaPlanted, status, notes },
      { new: true }
    )
    .populate('farmerId', 'rsbaNumber firstName lastName contactNumber address')
    .populate('cropId', 'name scientificName');

    if (!farmerCrop) {
      return res.status(404).json({ message: 'Farmer-crop relationship not found.' });
    }

    res.json(farmerCrop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove crop from farmer
exports.removeCropFromFarmer = async (req, res) => {
  try {
    const farmerCrop = await FarmerCrop.findByIdAndDelete(req.params.id);
    if (!farmerCrop) {
      return res.status(404).json({ message: 'Farmer-crop relationship not found.' });
    }
    res.json({ message: 'Crop removed from farmer successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
