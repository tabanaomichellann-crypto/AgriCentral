const CropDamage = require('../models/CropDamage.model');
const Farmer = require('../models/Farmer.model');
const Crop = require('../models/Crop.model');

// Get all crop damages
exports.getAllCropDamages = async (req, res) => {
  try {
    const damages = await CropDamage.find()
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber')
      .populate('cropId', 'name scientificName')
      .sort({ reportedDate: -1 });
    res.json(damages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get damages by farmer
exports.getDamagesByFarmer = async (req, res) => {
  try {
    const farmerId = req.params.farmerId;
    const damages = await CropDamage.find({ farmerId })
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber')
      .populate('cropId', 'name scientificName')
      .sort({ reportedDate: -1 });
    res.json(damages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get damages by crop
exports.getDamagesByCrop = async (req, res) => {
  try {
    const cropId = req.params.cropId;
    const damages = await CropDamage.find({ cropId })
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber')
      .populate('cropId', 'name scientificName')
      .sort({ reportedDate: -1 });
    res.json(damages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get damages by status
exports.getDamagesByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const damages = await CropDamage.find({ status })
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber')
      .populate('cropId', 'name scientificName')
      .sort({ reportedDate: -1 });
    res.json(damages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Report new crop damage
exports.reportCropDamage = async (req, res) => {
  try {
    const { farmerId, cropId, damageType, severity, affectedArea, description, notes } = req.body;

    // Validate farmer and crop exist
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found.' });
    }

    const damage = await CropDamage.create({
      farmerId,
      cropId,
      damageType,
      severity,
      affectedArea,
      description,
      notes
    });

    const populatedDamage = await CropDamage.findById(damage._id)
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber')
      .populate('cropId', 'name scientificName');

    res.status(201).json(populatedDamage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update crop damage
exports.updateCropDamage = async (req, res) => {
  try {
    const { status, severity, actionTaken, resolvedDate, notes, affectedArea } = req.body;

    const damage = await CropDamage.findByIdAndUpdate(
      req.params.id,
      { status, severity, actionTaken, resolvedDate, notes, affectedArea },
      { new: true }
    )
    .populate('farmerId', 'rsbaNumber firstName lastName contactNumber')
    .populate('cropId', 'name scientificName');

    if (!damage) {
      return res.status(404).json({ message: 'Crop damage record not found.' });
    }

    res.json(damage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete crop damage record
exports.deleteCropDamage = async (req, res) => {
  try {
    const damage = await CropDamage.findByIdAndDelete(req.params.id);
    if (!damage) {
      return res.status(404).json({ message: 'Crop damage record not found.' });
    }
    res.json({ message: 'Crop damage record deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get damage statistics
exports.getDamageStats = async (req, res) => {
  try {
    const stats = {
      totalDamages: 0,
      byStatus: {},
      bySeverity: {},
      byType: {},
      criticalCount: 0,
      resolvedCount: 0,
      avgAffectedArea: 0
    };

    const damages = await CropDamage.find();

    stats.totalDamages = damages.length;

    let totalArea = 0;
    let areaCount = 0;

    damages.forEach(d => {
      // By status
      stats.byStatus[d.status] = (stats.byStatus[d.status] || 0) + 1;
      // By severity
      stats.bySeverity[d.severity] = (stats.bySeverity[d.severity] || 0) + 1;
      // By type
      stats.byType[d.damageType] = (stats.byType[d.damageType] || 0) + 1;
      // Critical count
      if (d.severity === 'Critical') stats.criticalCount++;
      // Resolved count
      if (d.status === 'Resolved' || d.status === 'Closed') stats.resolvedCount++;
      // Average area
      if (d.affectedArea) {
        totalArea += d.affectedArea;
        areaCount++;
      }
    });

    if (areaCount > 0) {
      stats.avgAffectedArea = (totalArea / areaCount).toFixed(2);
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
