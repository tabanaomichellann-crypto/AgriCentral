const EquipmentRequest = require('../models/EquipmentRequest.model');
const Equipment = require('../models/equipment.model');

// Get all equipment requests (for coordinators, governors, heads)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await EquipmentRequest.find()
      .populate('equipment_id')
      .populate('farmer_id', 'fullName email')
      .populate('association_id', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's own equipment requests (for farmers)
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await EquipmentRequest.find({ farmer_id: req.user.id })
      .populate('equipment_id')
      .populate('farmer_id', 'fullName email')
      .populate('association_id', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create equipment request (farmers/association reps)
exports.createRequest = async (req, res) => {
  try {
    const { equipment_id, quantity_requested, purpose, association_id } = req.body;

    if (!equipment_id || !quantity_requested || !purpose) {
      return res.status(400).json({ message: 'Missing required fields: equipment_id, quantity_requested, purpose' });
    }

    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    if (equipment.quantity_available < quantity_requested) {
      return res.status(400).json({ 
        message: `Not enough available equipment. Only ${equipment.quantity_available} available.` 
      });
    }

    const request = new EquipmentRequest({
      equipment_id,
      farmer_id: req.user.id,
      quantity_requested,
      purpose,
      ...(association_id && { association_id }),
      status: 'Pending',
    });

    await request.save();
    await request.populate('equipment_id');
    await request.populate('farmer_id', 'fullName email');
    if (association_id) {
      await request.populate('association_id', 'name');
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Governor decision (approve/reject)
exports.governorDecision = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decision, remarks } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be "approve" or "reject".' });
    }

    const request = await EquipmentRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request has already been processed.' });
    }

    const newStatus = decision === 'approve' ? 'Gov_Approved' : 'Rejected';
    request.status = newStatus;
    request.governor_remarks = remarks || '';

    await request.save();
    await request.populate('equipment_id');
    await request.populate('farmer_id', 'fullName email');
    if (request.association_id) {
      await request.populate('association_id', 'name');
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Head decision (approve/reject/issue)
exports.headDecision = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decision, remarks } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be "approve" or "reject".' });
    }

    const request = await EquipmentRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.status !== 'Gov_Approved') {
      return res.status(400).json({ message: 'Request must be governor-approved first.' });
    }

    const newStatus = decision === 'approve' ? 'Issued' : 'Rejected';
    request.status = newStatus;
    request.head_remarks = remarks || '';

    if (newStatus === 'Issued') {
      request.issued_date = new Date();
      // Decrement available quantity
      await Equipment.findByIdAndUpdate(
        request.equipment_id,
        { $inc: { quantity_available: -request.quantity_requested, quantity_in_use: request.quantity_requested } }
      );
    }

    await request.save();
    await request.populate('equipment_id');
    await request.populate('farmer_id', 'fullName email');
    if (request.association_id) {
      await request.populate('association_id', 'name');
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single request
exports.getRequest = async (req, res) => {
  try {
    const request = await EquipmentRequest.findById(req.params.requestId)
      .populate('equipment_id')
      .populate('farmer_id', 'fullName email')
      .populate('association_id', 'name');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
