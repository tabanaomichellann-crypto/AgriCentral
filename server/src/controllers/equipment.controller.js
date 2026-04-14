const Equipment = require('../models/equipment.model');

exports.getEquipment = async (req, res) => {
  try {
    res.json(await Equipment.find().sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createEquipment = async (req, res) => {
  try {
    const { equipment_name, category, quantity_total, quantity_available, status } = req.body;
    const item = await Equipment.create({
      equipment_name,
      category,
      quantity_total: Number(quantity_total),
      quantity_available: Number(quantity_available),
      status,
      ...(req.file ? { imageId: req.file.filename } : {}),
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteEquipment = async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateEquipment = async (req, res) => {
  try {
    const updateData = {
      equipment_name: req.body.equipment_name,
      category: req.body.category,
      quantity_total: req.body.quantity_total !== undefined ? Number(req.body.quantity_total) : undefined,
      quantity_available: req.body.quantity_available !== undefined ? Number(req.body.quantity_available) : undefined,
      status: req.body.status,
      ...(req.file ? { imageId: req.file.filename } : {}),
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const item = await Equipment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!item) return res.status(404).json({ message: 'Equipment not found.' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};