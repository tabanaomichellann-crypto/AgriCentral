const Livestock = require('../models/livestock.model');

exports.getLivestock = async (req, res) => {
  try {
    const items = await Livestock.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLivestockById = async (req, res) => {
  try {
    const item = await Livestock.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Livestock not found.' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createLivestock = async (req, res) => {
  try {
    const livestock = await Livestock.create(req.body);
    res.status(201).json(livestock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLivestock = async (req, res) => {
  try {
    const livestock = await Livestock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!livestock) return res.status(404).json({ message: 'Livestock not found.' });
    res.json(livestock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteLivestock = async (req, res) => {
  try {
    await Livestock.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};