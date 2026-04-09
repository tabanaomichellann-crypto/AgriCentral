const Farmer           = require('../models/Farmer.model');
const Association      = require('../models/Association.model');
const AssociationMember = require('../models/AssociationMember.model');
const User             = require('../models/User.model');

// Farmers 

exports.getFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find().sort({ registeredAt: -1 });
    res.json(farmers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createFarmer = async (req, res) => {
  try {
    const existing = await Farmer.findOne({ rsbaNumber: req.body.rsbaNumber });
    if (existing) return res.status(400).json({ message: 'RSBA number already registered.' });
    const farmer = await Farmer.create(req.body);
    res.status(201).json(farmer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteFarmer = async (req, res) => {
  try {
    await Farmer.findByIdAndDelete(req.params.id);
    await AssociationMember.deleteMany({ farmerId: req.params.id });
    res.json({ message: 'Farmer deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Associations ──────────────────────────────────────────────────────────────

exports.getAssociations = async (req, res) => {
  try {
    const list = await Association.find()
      .populate('presidentUserId', 'fullName')
      .sort({ registeredAt: -1 });

    // attach member count to each association
    const withCounts = await Promise.all(list.map(async (a) => {
      const count = await AssociationMember.countDocuments({ associationId: a._id });
      return { ...a.toObject(), memberCount: count };
    }));

    res.json(withCounts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createAssociation = async (req, res) => {
  try {
    const assoc = await Association.create(req.body);
    res.status(201).json(assoc);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteAssociation = async (req, res) => {
  try {
    await Association.findByIdAndDelete(req.params.id);
    await AssociationMember.deleteMany({ associationId: req.params.id });
    res.json({ message: 'Association deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Members ───────────────────────────────────────────────────────────────────

exports.getMembers = async (req, res) => {
  try {
    const members = await AssociationMember.find({ associationId: req.params.id })
      .populate('farmerId', 'rsbaNumber firstName lastName contactNumber address');
    res.json(members);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addMember = async (req, res) => {
  try {
    const { farmerId } = req.body;
    const exists = await AssociationMember.findOne({ associationId: req.params.id, farmerId });
    if (exists) return res.status(400).json({ message: 'Farmer is already a member.' });
    const member = await AssociationMember.create({ associationId: req.params.id, farmerId });
    res.status(201).json(member);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.removeMember = async (req, res) => {
  try {
    await AssociationMember.findByIdAndDelete(req.params.memberId);
    res.json({ message: 'Member removed.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── FAR users (for president dropdown) ───────────────────────────────────────

exports.getFARUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'Farmer Association Representative' })
      .select('fullName username');
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};