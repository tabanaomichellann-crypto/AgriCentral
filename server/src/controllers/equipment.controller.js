const Equipment = require('../models/equipment.model');

exports.getEquipment = async (req, res) => {
  try {
    const filter = req.query.type ? { equipmentType: req.query.type } : {};
    res.json(await Equipment.find(filter).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createEquipment = async (req, res) => {
  try {
    const item = await Equipment.create(req.body);
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteEquipment = async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};