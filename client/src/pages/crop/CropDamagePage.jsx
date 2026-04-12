// CropDamagePage.jsx - Crop damage monitoring and reporting
// Track and manage crop damage reports, severity levels, and resolution status

import { useState, useEffect } from 'react';
import {
  Modal, Field, StatusBadge, StatCard, SectionTitle,
  btn, inputStyle, labelStyle, Empty, DataTable, TD,
} from '../Shared';
import {
  getCrops, getFarmers, getCropDamages, getCropDamageStats,
  reportCropDamage, updateCropDamage, deleteCropDamage
} from '../../services/api';

export default function CropDamagePage() {
  const role = localStorage.getItem('role');
  const isCoordinator = role === 'Program Coordinator';

  const [crops, setCrops] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [damages, setDamages] = useState([]);
  const [damageStats, setDamageStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDamage, setEditingDamage] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    farmerId: '',
    cropId: '',
    damageType: '',
    severity: '',
    affectedArea: '',
    description: '',
    actionTaken: '',
    resolvedDate: '',
    notes: '',
    status: 'Reported'
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [cropsRes, farmersRes, damagesRes, statsRes] = await Promise.all([
        getCrops(),
        getFarmers(),
        getCropDamages(),
        getCropDamageStats()
      ]);
      setCrops(cropsRes.data);
      setFarmers(farmersRes.data);
      setDamages(damagesRes.data);
      setDamageStats(statsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (damage = null) => {
    if (damage) {
      setEditingDamage(damage);
      setFormData({
        farmerId: damage.farmerId._id,
        cropId: damage.cropId._id,
        damageType: damage.damageType,
        severity: damage.severity,
        affectedArea: damage.affectedArea || '',
        description: damage.description,
        actionTaken: damage.actionTaken || '',
        resolvedDate: damage.resolvedDate ? damage.resolvedDate.split('T')[0] : '',
        notes: damage.notes || '',
        status: damage.status
      });
    } else {
      setEditingDamage(null);
      setFormData({
        farmerId: '',
        cropId: '',
        damageType: '',
        severity: '',
        affectedArea: '',
        description: '',
        actionTaken: '',
        resolvedDate: '',
        notes: '',
        status: 'Reported'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingDamage(null);
    setFormData({
      farmerId: '',
      cropId: '',
      damageType: '',
      severity: '',
      affectedArea: '',
      description: '',
      actionTaken: '',
      resolvedDate: '',
      notes: '',
      status: 'Reported'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingDamage) {
        await updateCropDamage(editingDamage._id, formData);
        alert('Damage record updated successfully');
      } else {
        await reportCropDamage(formData);
        alert('Damage reported successfully');
      }
      handleCloseModal();
      loadInitialData();
    } catch (err) {
      alert('Error: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this damage record?')) return;
    try {
      setLoading(true);
      await deleteCropDamage(id);
      alert('Damage record deleted successfully');
      loadInitialData();
    } catch (err) {
      alert('Error: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDamages = () => {
    let filtered = damages;
    if (filterStatus) {
      filtered = filtered.filter(d => d.status === filterStatus);
    }
    if (filterSeverity) {
      filtered = filtered.filter(d => d.severity === filterSeverity);
    }
    return filtered;
  };

  const filteredDamages = getFilteredDamages();

  const getStatusColor = (status) => {
    const colors = {
      'Reported': '#dc2626',
      'In Progress': '#f59e0b',
      'Resolved': '#10b981',
      'Closed': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Low': '#10b981',
      'Medium': '#f59e0b',
      'High': '#ef4444',
      'Critical': '#dc2626'
    };
    return colors[severity] || '#6b7280';
  };

  return (
    <>
      {/* Enhanced Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Damage Reports" value={damageStats?.totalDamages || 0} icon="⚠️" accent="#dc2626" />
        <StatCard label="Critical Cases" value={damageStats?.criticalCount || 0} icon="🚨" accent="#ef4444" />
        <StatCard label="Resolved" value={damageStats?.resolvedCount || 0} icon="✅" accent="#10b981" />
        <StatCard label="Avg Affected Area" value={`${damageStats?.avgAffectedArea || 0} ha`} icon="📊" accent="#3b82f6" />
      </div>

      {/* Damage Type & Status Guide */}
      <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#374151' }}>📋 Damage Classification & Status</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 600, color: '#374151' }}>Damage Types:</p>
            <ul style={{ margin: '0', paddingLeft: 20, fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
              <li>🐛 Pest - Insect or pest infestation</li>
              <li>🦠 Disease - Crop disease or infection</li>
              <li>🌪️ Weather - Storm, flood, drought damage</li>
              <li>🌱 Nutrient - Soil nutrient deficiency</li>
              <li>📌 Other - Other damage types</li>
            </ul>
          </div>
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 600, color: '#374151' }}>Severity Levels:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Low</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Minor damage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Medium</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Moderate impact</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>High</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Significant loss</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Critical</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Total crop loss risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#666', display: 'block', marginBottom: 4 }}>Filter by Status:</label>
          <select
            value={filterStatus || ''}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            style={{ ...inputStyle, minWidth: 140 }}
          >
            <option value="">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#666', display: 'block', marginBottom: 4 }}>Filter by Severity:</label>
          <select
            value={filterSeverity || ''}
            onChange={(e) => setFilterSeverity(e.target.value || null)}
            style={{ ...inputStyle, minWidth: 140 }}
          >
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Section Title */}
      <SectionTitle
        title="Crop Damage Reports"
        sub={`Monitoring ${filteredDamages.length} damage record(s)`}
        action={
          isCoordinator && (
            <button style={btn.primary} onClick={() => handleOpenModal()}>
              + Report Damage
            </button>
          )
        }
      />

      {/* Damages Table */}
      {loading && filteredDamages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading damage records...</div>
      ) : filteredDamages.length === 0 ? (
        <Empty icon="✅" message="No damage reports found." />
      ) : (
        <DataTable
          columns={['FARMER', 'CROP', 'DAMAGE TYPE', 'SEVERITY', 'REPORTED DATE', 'STATUS', 'AFFECTED AREA', 'ACTIONS']}
          emptyIcon="⚠️"
          emptyMsg="No damages found."
          rows={filteredDamages.map(dmg => (
            <>
              <TD bold>{dmg.farmerId.firstName} {dmg.farmerId.lastName}</TD>
              <TD>{dmg.cropId.name}</TD>
              <TD>{dmg.damageType}</TD>
              <TD>
                <span style={{
                  background: getSeverityColor(dmg.severity),
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {dmg.severity}
                </span>
              </TD>
              <TD muted>{new Date(dmg.reportedDate).toLocaleDateString()}</TD>
              <TD>
                <span style={{
                  background: getStatusColor(dmg.status),
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {dmg.status}
                </span>
              </TD>
              <TD>{dmg.affectedArea ? `${dmg.affectedArea} ha` : '—'}</TD>
              <td style={{ padding: '10px 16px' }}>
                {isCoordinator && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={btn.outline} onClick={() => handleOpenModal(dmg)}>Edit</button>
                    <button style={btn.danger} onClick={() => handleDelete(dmg._id)} disabled={loading}>Delete</button>
                  </div>
                )}
              </td>
            </>
          ))}
        />
      )}

      {/* Report/Edit Damage Modal */}
      {modalOpen && (
        <Modal
          title={editingDamage ? 'Update Damage Report' : 'Report Crop Damage'}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel={editingDamage ? 'Update' : 'Report'}
          wide
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Farmer *">
              <select
                name="farmerId"
                value={formData.farmerId}
                onChange={handleInputChange}
                style={inputStyle}
                required
              >
                <option value="">Select a farmer</option>
                {farmers.map(farmer => (
                  <option key={farmer._id} value={farmer._id}>
                    {farmer.firstName} {farmer.lastName} ({farmer.rsbaNumber})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Crop *">
              <select
                name="cropId"
                value={formData.cropId}
                onChange={handleInputChange}
                style={inputStyle}
                required
              >
                <option value="">Select a crop</option>
                {crops.map(crop => (
                  <option key={crop._id} value={crop._id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Damage Type *">
              <select
                name="damageType"
                value={formData.damageType}
                onChange={handleInputChange}
                style={inputStyle}
                required
              >
                <option value="">Select damage type</option>
                <option value="Pest">🐛 Pest</option>
                <option value="Disease">🦠 Disease</option>
                <option value="Weather">🌪️ Weather</option>
                <option value="Nutrient">🌱 Nutrient</option>
                <option value="Other">📌 Other</option>
              </select>
            </Field>

            <Field label="Severity *">
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                style={inputStyle}
                required
              >
                <option value="">Select severity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Affected Area (hectares)">
              <input
                type="number"
                name="affectedArea"
                value={formData.affectedArea}
                onChange={handleInputChange}
                style={inputStyle}
                step="0.01"
                placeholder="e.g., 2.5"
              />
            </Field>

            <Field label="Status">
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={inputStyle}
              >
                <option value="Reported">Reported</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </Field>
          </div>

          <Field label="Description *">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              style={{ ...inputStyle, minHeight: 80, fontFamily: 'inherit' }}
              placeholder="Describe the damage..."
              required
            />
          </Field>

          <Field label="Action Taken">
            <textarea
              name="actionTaken"
              value={formData.actionTaken}
              onChange={handleInputChange}
              style={{ ...inputStyle, minHeight: 60, fontFamily: 'inherit' }}
              placeholder="What actions have been taken to address this..."
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Resolved Date">
              <input
                type="date"
                name="resolvedDate"
                value={formData.resolvedDate}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              style={{ ...inputStyle, minHeight: 60, fontFamily: 'inherit' }}
              placeholder="Additional notes..."
            />
          </Field>
        </Modal>
      )}
    </>
  );
}
