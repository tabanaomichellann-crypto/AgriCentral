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
    const { associationName, presidentName } = req.body;
    if (!associationName || !presidentName) {
      return res.status(400).json({ message: 'Missing required fields: associationName, presidentName' });
    }
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

// ── Demo Data Seeding (for development only) ────────────────────────────────

exports.seedDemo = async (req, res) => {
  try {
    // Check if demo data already exists
    const existing = await Farmer.findOne({ rsbaNumber: 'DEMO-001' });
    if (existing) return res.status(400).json({ message: 'Demo data already seeded.' });

    // Create association
    const assoc = await Association.create({
      agencyCode: 'ASSOC-001',
      associationName: 'San Jose Farmers Cooperative',
      region: 'Region III',
      province: 'Bulacan',
      municipality: 'San Jose',
      barangay: 'Tuktukan',
      presidentName: 'Juan Dela Cruz',
      contactNumber: '09123456789',
      memberCount: 45,
    });

    // Create farmers
    await Farmer.create([
      {
        rsbaNumber: 'DEMO-001',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        contactNumber: '09123456789',
        address: 'Sitio Laya, San Jose, Bulacan',
        proofOfOwnershipType: 'Ownership',
        validIdRef: 'Driver\'s License - ABC123456',
      },
      {
        rsbaNumber: 'DEMO-002',
        firstName: 'Maria',
        lastName: 'Santos',
        contactNumber: '09198765432',
        address: 'Barangay Tuktukan, San Jose, Bulacan',
        proofOfOwnershipType: 'Tenancy',
        validIdRef: 'Voter\'s ID - XYZ789012',
      },
      {
        rsbaNumber: 'DEMO-003',
        firstName: 'Pedro',
        lastName: 'Reyes',
        contactNumber: '09156789012',
        address: 'Barangay Paluming, San Jose, Bulacan',
        proofOfOwnershipType: 'Agreement',
        validIdRef: 'PRC ID - DEF345678',
      },
    ]);

    res.status(201).json({ message: '✅ Demo data seeded successfully!', association: assoc });
  } catch (err) { res.status(500).json({ message: err.message }); }
};