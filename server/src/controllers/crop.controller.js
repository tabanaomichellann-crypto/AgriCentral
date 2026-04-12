const Crop = require('../models/Crop.model');

// Seed crops (development only)
exports.seedCrops = async (req, res) => {
  try {
    const existingCount = await Crop.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({ message: 'Crops already seeded.' });
    }

    const defaultCrops = [
      {
        name: 'Rice',
        scientificName: 'Oryza sativa',
        description: 'Staple grain crop',
        growingSeasonDays: 120,
        recommendedPHRange: '5.5-7.0',
        waterRequirement: '1000-1500mm',
        tempRange: '20-30°C'
      },
      {
        name: 'Corn',
        scientificName: 'Zea mays',
        description: 'Major cereal crop',
        growingSeasonDays: 90,
        recommendedPHRange: '6.0-7.5',
        waterRequirement: '500-800mm',
        tempRange: '18-30°C'
      },
      {
        name: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        description: 'Vegetable crop',
        growingSeasonDays: 70,
        recommendedPHRange: '6.0-6.8',
        waterRequirement: '400-600mm',
        tempRange: '20-25°C'
      },
      {
        name: 'Cabbage',
        scientificName: 'Brassica oleracea',
        description: 'Leafy vegetable',
        growingSeasonDays: 90,
        recommendedPHRange: '6.0-7.5',
        waterRequirement: '450-650mm',
        tempRange: '15-20°C'
      },
      {
        name: 'Onion',
        scientificName: 'Allium cepa',
        description: 'Bulb vegetable',
        growingSeasonDays: 150,
        recommendedPHRange: '6.0-7.5',
        waterRequirement: '350-500mm',
        tempRange: '15-25°C'
      }
    ];

    await Crop.insertMany(defaultCrops);
    res.status(201).json({ message: 'Crops seeded successfully.', count: defaultCrops.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all crops
exports.getCrops = async (req, res) => {
  try {
    const crops = await Crop.find().sort({ name: 1 });
    res.json(crops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new crop
exports.createCrop = async (req, res) => {
  try {
    const existing = await Crop.findOne({ name: req.body.name });
    if (existing) {
      return res.status(400).json({ message: 'Crop already exists.' });
    }
    const crop = await Crop.create(req.body);
    res.status(201).json(crop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a crop
exports.updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found.' });
    }
    res.json(crop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a crop
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findByIdAndDelete(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found.' });
    }
    res.json({ message: 'Crop deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
