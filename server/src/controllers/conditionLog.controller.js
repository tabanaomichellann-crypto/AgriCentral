const ConditionLog = require('../models/ConditionLog.model');
const Equipment = require('../models/equipment.model');

// Get all condition logs (for coordinators)
exports.getAllConditionLogs = async (req, res) => {
  try {
    const logs = await ConditionLog.find()
      .populate('equipment_id')
      .populate('submitted_by', 'fullName email')
      .populate('validated_by', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create condition log (for AEW)
exports.createConditionLog = async (req, res) => {
  try {
    const { equipment_id, condition_status, remarks } = req.body;

    if (!equipment_id || !condition_status || !remarks) {
      return res.status(400).json({
        message: 'Missing required fields: equipment_id, condition_status, remarks'
      });
    }

    // Check if equipment exists
    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    // Handle file upload (temporarily disabled)
    let proofImage = null;
    // if (req.file) {
    //   proofImage = req.file.filename; // multer saves the file
    // }

    const log = new ConditionLog({
      equipment_id,
      submitted_by: req.user.id,
      condition_status,
      remarks,
      proof_image: proofImage,
    });

    await log.save();
    await log.populate('equipment_id');
    await log.populate('submitted_by', 'fullName email');

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Validate condition log (for coordinators)
exports.validateConditionLog = async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await ConditionLog.findById(logId);
    if (!log) {
      return res.status(404).json({ message: 'Condition log not found.' });
    }

    if (log.validated) {
      return res.status(400).json({ message: 'Log already validated.' });
    }

    log.validated = true;
    log.validated_by = req.user.id;
    log.validated_at = new Date();

    await log.save();
    await log.populate('equipment_id');
    await log.populate('submitted_by', 'fullName email');
    await log.populate('validated_by', 'fullName email');

    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};