const LivestockRequest = require('../models/LivestockRequest.model');
const Livestock = require('../models/livestock.model');

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await LivestockRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await LivestockRequest.find({ farmer_id: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const {
      livestock_id,
      farmer_id,
      association_id,
      quantity_requested,
      purpose,
    } = req.body;

    if (!livestock_id || !quantity_requested || !purpose || !farmer_id) {
      return res.status(400).json({ message: 'Missing required fields: livestock_id, farmer_id, quantity_requested, purpose' });
    }

    const livestock = await Livestock.findById(livestock_id);
    if (!livestock) {
      return res.status(404).json({ message: 'Livestock not found.' });
    }

    if (livestock.quantity_available < quantity_requested) {
      return res.status(400).json({
        message: `Not enough available livestock. Only ${livestock.quantity_available} available.`,
      });
    }

    const request = new LivestockRequest({
      livestock_id,
      farmer_id,
      association_id,
      quantity_requested,
      purpose,
      status: 'Pending',
    });

    await request.save();
    await request.populate('livestock_id');
    await request.populate('farmer_id', 'fullName email');
    if (association_id) {
      await request.populate('association_id', 'name');
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.governorDecision = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decision, remarks } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be "approve" or "reject".' });
    }

    const request = await LivestockRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request has already been processed.' });
    }

    request.status = decision === 'approve' ? 'Gov_Approved' : 'Rejected';
    request.governor_remarks = remarks || '';
    await request.save();

    await request.populate('livestock_id');
    await request.populate('farmer_id', 'fullName email');
    if (request.association_id) {
      await request.populate('association_id', 'name');
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.headDecision = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decision, remarks } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be "approve" or "reject".' });
    }

    const request = await LivestockRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.status !== 'Gov_Approved') {
      return res.status(400).json({ message: 'Request must be governor-approved first.' });
    }

    request.status = decision === 'approve' ? 'Issued' : 'Rejected';
    request.head_remarks = remarks || '';

    if (request.status === 'Issued') {
      request.issued_date = new Date();
    }

    await request.save();
    await request.populate('livestock_id');
    await request.populate('farmer_id', 'fullName email');
    if (request.association_id) {
      await request.populate('association_id', 'name');
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
