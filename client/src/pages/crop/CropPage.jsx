// CropPage.jsx - Crop management view for coordinators
// Shows crop information with ability to create, update, and delete crops

import { useState, useEffect } from 'react';
import {
  Modal, Field, StatCard, SectionTitle,
  btn, inputStyle, Empty, DataTable, TD,
} from '../Shared';
import { getCrops, createCrop, updateCrop, deleteCrop } from '../../services/api';
import CropFarmersPage from './CropFarmersPage';
import CropDamagePage from './CropDamagePage';

export default function CropPage() {
  const role = localStorage.getItem('role');
  const isCoordinator = role === 'Program Coordinator';

  const [activeTab, setActiveTab] = useState('Management');
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    description: '',
    growingSeasonDays: '',
    recommendedPHRange: '',
    waterRequirement: '',
    tempRange: '',
  });

  // Fetch crops on mount
  useEffect(() => {
    if (activeTab === 'Management') {
      loadCrops();
    }
  }, [activeTab]);

  const loadCrops = async () => {
    try {
      setLoading(true);
      const res = await getCrops();
      setCrops(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load crops: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (crop = null) => {
    if (crop) {
      setEditingCrop(crop);
      setFormData({
        name: crop.name,
        scientificName: crop.scientificName,
        description: crop.description,
        growingSeasonDays: crop.growingSeasonDays,
        recommendedPHRange: crop.recommendedPHRange,
        waterRequirement: crop.waterRequirement,
        tempRange: crop.tempRange,
      });
    } else {
      setEditingCrop(null);
      setFormData({
        name: '',
        scientificName: '',
        description: '',
        growingSeasonDays: '',
        recommendedPHRange: '',
        waterRequirement: '',
        tempRange: '',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCrop(null);
    setFormData({
      name: '',
      scientificName: '',
      description: '',
      growingSeasonDays: '',
      recommendedPHRange: '',
      waterRequirement: '',
      tempRange: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingCrop) {
        await updateCrop(editingCrop._id, formData);
        alert('Crop updated successfully');
      } else {
        await createCrop(formData);
        alert('Crop created successfully');
      }
      handleCloseModal();
      loadCrops();
    } catch (err) {
      alert('Error: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) return;
    try {
      setLoading(true);
      await deleteCrop(id);
      alert('Crop deleted successfully');
      loadCrops();
    } catch (err) {
      alert('Error: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tab Navigation */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
          <button
            style={{
              ...btn.ghost,
              ...(activeTab === 'Management' ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {})
            }}
            onClick={() => setActiveTab('Management')}
          >
            <i className="bx bx-leaf" style={{ marginRight: 6 }}></i> Crop Management
          </button>
          <button
            style={{
              ...btn.ghost,
              ...(activeTab === 'Farmers' ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {})
            }}
            onClick={() => setActiveTab('Farmers')}
          >
            <i className="bx bx-group" style={{ marginRight: 6 }}></i> Farmers by Crop
          </button>
          <button
            style={{
              ...btn.ghost,
              ...(activeTab === 'Damage' ? { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' } : {})
            }}
            onClick={() => setActiveTab('Damage')}
          >
            <i className="bx bx-alert-triangle" style={{ marginRight: 6 }}></i> Damage Monitoring
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Management' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <StatCard label="Total Crops" value={crops.length} icon={<i className="bx bx-leaf" />} accent="#16a34a" />
            <StatCard label="Average Growing Season" value={crops.length > 0 ? Math.round(crops.reduce((sum, c) => sum + (c.growingSeasonDays || 0), 0) / crops.length) + ' days' : '—'} icon={<i className="bx bx-calendar" />} accent="#2563eb" />
          </div>

          {/* Header with Add button */}
          <SectionTitle
            title="All Crops"
            sub={`${crops.length} crop${crops.length !== 1 ? 's' : ''} registered in the system`}
            action={
              isCoordinator && (
                <button style={btn.primary} onClick={() => handleOpenModal()}>
                  + Add Crop
                </button>
              )
            }
          />

          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

          {/* Crops table */}
          {loading && crops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading crops...</div>
          ) : crops.length === 0 ? (
            <Empty icon="🌾" message="No crops registered yet." />
          ) : (
            <DataTable
              columns={['NAME', 'SCIENTIFIC NAME', 'GROWING SEASON', 'PH RANGE', 'WATER NEED', 'TEMPERATURE', 'ACTIONS']}
              emptyIcon="🌾"
              emptyMsg="No crops found."
              rows={crops.map(crop => (
                <>
                  <TD bold>{crop.name}</TD>
                  <TD muted>{crop.scientificName || '—'}</TD>
                  <TD>{crop.growingSeasonDays ? crop.growingSeasonDays + ' days' : '—'}</TD>
                  <TD muted>{crop.recommendedPHRange || '—'}</TD>
                  <TD muted>{crop.waterRequirement || '—'}</TD>
                  <TD muted>{crop.tempRange || '—'}</TD>
                  <td style={{ padding: '10px 16px' }}>
                    {isCoordinator && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={btn.outline} onClick={() => handleOpenModal(crop)}>Edit</button>
                        <button style={btn.danger} onClick={() => handleDelete(crop._id)} disabled={loading}>Delete</button>
                      </div>
                    )}
                  </td>
                </>
              ))}
            />
          )}

          {/* Create/Edit Modal */}
          {modalOpen && (
            <Modal
              title={editingCrop ? 'Edit Crop' : 'Add New Crop'}
              onClose={handleCloseModal}
              onSubmit={handleSubmit}
              loading={loading}
              submitLabel={editingCrop ? 'Update' : 'Create'}
              wide
            >
              <Field label="Crop Name *">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                  placeholder="e.g., Rice"
                />
              </Field>

              <Field label="Scientific Name">
                <input
                  type="text"
                  name="scientificName"
                  value={formData.scientificName}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="e.g., Oryza sativa"
                />
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, minHeight: 80, fontFamily: 'inherit' }}
                  placeholder="Enter crop description..."
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Growing Season (Days)">
                  <input
                    type="number"
                    name="growingSeasonDays"
                    value={formData.growingSeasonDays}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="e.g., 120"
                  />
                </Field>

                <Field label="Recommended PH Range">
                  <input
                    type="text"
                    name="recommendedPHRange"
                    value={formData.recommendedPHRange}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="e.g., 6.0-7.0"
                  />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Water Requirement">
                  <input
                    type="text"
                    name="waterRequirement"
                    value={formData.waterRequirement}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="e.g., 500-750mm"
                  />
                </Field>

                <Field label="Temperature Range">
                  <input
                    type="text"
                    name="tempRange"
                    value={formData.tempRange}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="e.g., 20-30°C"
                  />
                </Field>
              </div>
            </Modal>
          )}
        </>
      )}

      {activeTab === 'Farmers' && (
        <CropFarmersPage />
      )}

      {activeTab === 'Damage' && (
        <CropDamagePage />
      )}
    </>
  );
}
