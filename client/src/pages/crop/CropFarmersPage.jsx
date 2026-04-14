// CropFarmersPage.jsx - Shows farmers who plant different types of crops
// Displays crop-farmer relationships with ability to assign/unassign crops to farmers

import { useState, useEffect } from 'react';
import {
  Modal, Field, StatusBadge, StatCard, SectionTitle,
  btn, inputStyle, Empty, DataTable, TD,
} from '../Shared';
import {
  getCrops, getFarmers, getFarmerCrops,
  assignCropToFarmer, updateFarmerCrop, removeCropFromFarmer
} from '../../services/api';

export default function CropFarmersPage() {
  const role = localStorage.getItem('role');
  const isCoordinator = role === 'Program Coordinator';

  const [crops, setCrops] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [farmerCrops, setFarmerCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [viewMode, setViewMode] = useState('crop'); // 'crop' or 'farmer'
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFarmerCrop, setEditingFarmerCrop] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    farmerId: '',
    cropId: '',
    plantingDate: '',
    expectedHarvestDate: '',
    areaPlanted: '',
    notes: '',
  });

  // Fetch initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [cropsRes, farmersRes, farmerCropsRes] = await Promise.all([
        getCrops(),
        getFarmers(),
        getFarmerCrops()
      ]);
      setCrops(cropsRes.data);
      setFarmers(farmersRes.data);
      setFarmerCrops(farmerCropsRes.data);
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

  const handleOpenModal = (farmerCrop = null, cropId = null, farmerId = null) => {
    if (farmerCrop) {
      setEditingFarmerCrop(farmerCrop);
      setFormData({
        farmerId: farmerCrop.farmerId._id,
        cropId: farmerCrop.cropId._id,
        plantingDate: farmerCrop.plantingDate ? farmerCrop.plantingDate.split('T')[0] : '',
        expectedHarvestDate: farmerCrop.expectedHarvestDate ? farmerCrop.expectedHarvestDate.split('T')[0] : '',
        areaPlanted: farmerCrop.areaPlanted || '',
        notes: farmerCrop.notes || '',
      });
    } else {
      setEditingFarmerCrop(null);
      setFormData({
        farmerId: farmerId || '',
        cropId: cropId || '',
        plantingDate: new Date().toISOString().split('T')[0],
        expectedHarvestDate: '',
        areaPlanted: '',
        notes: '',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingFarmerCrop(null);
    setFormData({
      farmerId: '',
      cropId: '',
      plantingDate: '',
      expectedHarvestDate: '',
      areaPlanted: '',
      notes: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingFarmerCrop) {
        await updateFarmerCrop(editingFarmerCrop._id, formData);
        alert('Farmer-crop relationship updated successfully');
      } else {
        await assignCropToFarmer(formData);
        alert('Crop assigned to farmer successfully');
      }
      handleCloseModal();
      loadInitialData();
    } catch (err) {
      alert('Error: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this crop from the farmer?')) return;
    try {
      setLoading(true);
      await removeCropFromFarmer(id);
      alert('Crop removed from farmer successfully');
      loadInitialData();
    } catch (err) {
      alert('Error: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredFarmerCrops = () => {
    if (!selectedCrop) return farmerCrops;
    return farmerCrops.filter(fc => fc.cropId._id === selectedCrop);
  };

  const getFarmerDiversificationStats = () => {
    const farmerCropCounts = {};
    farmerCrops.forEach(fc => {
      const farmerId = fc.farmerId._id;
      if (!farmerCropCounts[farmerId]) {
        farmerCropCounts[farmerId] = { count: 0, crops: new Set() };
      }
      farmerCropCounts[farmerId].crops.add(fc.cropId._id);
      farmerCropCounts[farmerId].count += 1;
    });

    const stats = {
      singleCrop: 0,
      multiCrop: 0,
      maxCrops: 0,
      farmersByCropCount: {}
    };

    Object.values(farmerCropCounts).forEach(({ crops }) => {
      const cropCount = crops.size;
      stats.maxCrops = Math.max(stats.maxCrops, cropCount);
      if (cropCount === 1) stats.singleCrop++;
      else if (cropCount > 1) stats.multiCrop++;

      if (!stats.farmersByCropCount[cropCount]) {
        stats.farmersByCropCount[cropCount] = 0;
      }
      stats.farmersByCropCount[cropCount]++;
    });

    return stats;
  };

  const getFarmersWithCrops = () => {
    const farmerMap = {};
    farmerCrops.forEach(fc => {
      const farmerId = fc.farmerId._id;
      if (!farmerMap[farmerId]) {
        farmerMap[farmerId] = {
          farmer: fc.farmerId,
          crops: [],
          totalArea: 0
        };
      }
      farmerMap[farmerId].crops.push(fc);
      if (fc.areaPlanted) {
        farmerMap[farmerId].totalArea += parseFloat(fc.areaPlanted);
      }
    });

    return Object.values(farmerMap).sort((a, b) => b.crops.length - a.crops.length);
  };

  const getFilteredFarmers = () => {
    const farmersWithCrops = getFarmersWithCrops();
    if (!selectedFarmer) return farmersWithCrops;
    return farmersWithCrops.filter(f => f.farmer._id === selectedFarmer);
  };

  const getCropStats = () => {
    const stats = {};
    crops.forEach(crop => {
      stats[crop._id] = farmerCrops.filter(fc => fc.cropId._id === crop._id).length;
    });
    return stats;
  };

  const getFarmerHarvestRates = () => {
    const rates = {};
    const totals = {};

    farmerCrops.forEach(fc => {
      const id = fc.farmerId._id;
      totals[id] = (totals[id] || 0) + 1;
      if (fc.status === 'Harvested') {
        rates[id] = (rates[id] || 0) + 1;
      }
    });

    return Object.fromEntries(
      Object.entries(totals).map(([id, total]) => [
        id,
        total > 0 ? Math.round(((rates[id] || 0) / total) * 100) : 0
      ])
    );
  };

  const cropStats = getCropStats();
  const filteredFarmerCrops = getFilteredFarmerCrops();
  const farmersWithCrops = getFilteredFarmers();
  const diversificationStats = getFarmerDiversificationStats();
  const farmerHarvestRates = getFarmerHarvestRates();

  return (
    <>
      {/* Enhanced Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Relationships" value={farmerCrops.length} icon={<i className="bx bx-leaf" />} accent="#16a34a" />
        <StatCard label="Active Farmers" value={new Set(farmerCrops.map(fc => fc.farmerId._id)).size} icon={<i className="bx bx-user" />} accent="#2563eb" />
        <StatCard label="Crops Planted" value={new Set(farmerCrops.map(fc => fc.cropId._id)).size} icon={<i className="bx bx-plant" />} accent="#7c3aed" />
        <StatCard label="Multi-Crop Farmers" value={diversificationStats.multiCrop} icon={<i className="bx bx-git-branch" />} accent="#f59e0b" />
        <StatCard label="Single-Crop Farmers" value={diversificationStats.singleCrop} icon={<i className="bx bx-leaf" />} accent="#6b7280" />
        <StatCard label="Max Crops/Farmer" value={diversificationStats.maxCrops} icon={<i className="bx bx-star" />} accent="#dc2626" />
      </div>

      {/* View Mode Toggle */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>View by:</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            style={{ ...btn.ghost, ...(viewMode === 'crop' ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
            onClick={() => setViewMode('crop')}
          >
            <i className="bx bxs-leaf" style={{ marginRight: 6 }}></i> Crops
          </button>
          <button
            style={{ ...btn.ghost, ...(viewMode === 'farmer' ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
            onClick={() => setViewMode('farmer')}
          >
            <i className="bx bx-user" style={{ marginRight: 6 }}></i> Farmers
          </button>
        </div>
      </div>

      {/* Status Guide */}
      <div style={{ marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#374151' }}><i className="bx bx-notepad" style={{ marginRight: 8 }}></i>Crop Status Guide</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status="Planted" />
            <span style={{ fontSize: 13, color: '#64748b' }}>Crop has been planted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status="Growing" />
            <span style={{ fontSize: 13, color: '#64748b' }}>Crop is currently growing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status="Harvested" />
            <span style={{ fontSize: 13, color: '#64748b' }}>Crop has been successfully harvested</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status="Failed" />
            <span style={{ fontSize: 13, color: '#64748b' }}>Crop failed to grow/harvest</span>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: 8, background: '#fef3c7', borderRadius: 6, border: '1px solid #f59e0b' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 500 }}>
             <strong>Harvested Percentage:</strong> Calculated as (Harvested crops / Total crops) × 100 for each farmer
          </p>
        </div>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Conditional Content Based on View Mode */}
      {viewMode === 'crop' ? (
        <>
          {/* Crop View */}
          <SectionTitle
            title="Farmers by Crop"
            sub="View and manage which farmers plant specific crops"
            action={
              isCoordinator && (
                <button style={btn.primary} onClick={() => handleOpenModal()}>
                  + Assign Crop to Farmer
                </button>
              )
            }
          />

          {/* Crop selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                style={{ ...btn.ghost, ...(selectedCrop === null ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
                onClick={() => setSelectedCrop(null)}
              >
                All Crops ({farmerCrops.length})
              </button>
              {crops.map(crop => (
                <button
                  key={crop._id}
                  style={{ ...btn.ghost, ...(selectedCrop === crop._id ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
                  onClick={() => setSelectedCrop(crop._id)}
                >
                  {crop.name} ({cropStats[crop._id] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Farmer-Crop relationships table */}
          {loading && filteredFarmerCrops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading farmer-crop relationships...</div>
          ) : filteredFarmerCrops.length === 0 ? (
            <Empty icon={<i className="bx bx-leaf" />} message={selectedCrop ? "No farmers plant this crop yet." : "No farmer-crop relationships found."} />
          ) : (
            <DataTable
              columns={['FARMER', 'RSBA NUMBER', 'CROP', 'PLANTING DATE', 'EXPECTED HARVEST', 'HARVESTED %', 'AREA (HA)', 'STATUS', 'ACTIONS']}
              emptyIcon={<i className="bx bx-leaf" />}
              emptyMsg="No relationships found."
              rows={filteredFarmerCrops.map(fc => (
                <>
                  <TD bold>{fc.farmerId.firstName} {fc.farmerId.lastName}</TD>
                  <TD muted>{fc.farmerId.rsbaNumber}</TD>
                  <TD>{fc.cropId.name}</TD>
                  <TD muted>{fc.plantingDate ? new Date(fc.plantingDate).toLocaleDateString() : '—'}</TD>
                  <TD muted>{fc.expectedHarvestDate ? new Date(fc.expectedHarvestDate).toLocaleDateString() : '—'}</TD>
                  <TD>{farmerHarvestRates[fc.farmerId._id] != null ? `${farmerHarvestRates[fc.farmerId._id]}%` : '—'}</TD>
                  <TD>{fc.areaPlanted ? `${fc.areaPlanted} ha` : '—'}</TD>
                  <TD><StatusBadge status={fc.status || 'Planted'} /></TD>
                  <td style={{ padding: '10px 16px' }}>
                    {isCoordinator && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={btn.outline} onClick={() => handleOpenModal(fc)}>Edit</button>
                        <button style={btn.danger} onClick={() => handleRemove(fc._id)} disabled={loading}>Remove</button>
                      </div>
                    )}
                  </td>
                </>
              ))}
            />
          )}
        </>
      ) : (
        <>
          {/* Farmer View - Shows farmers who plant different types of crops */}
          <SectionTitle
            title="Farmers by Crop Diversity"
            sub="View farmers and all the different crops they plant"
            action={
              isCoordinator && (
                <button style={btn.primary} onClick={() => handleOpenModal()}>
                  + Assign Crop to Farmer
                </button>
              )
            }
          />

          {/* Farmer selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                style={{ ...btn.ghost, ...(selectedFarmer === null ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
                onClick={() => setSelectedFarmer(null)}
              >
                All Farmers ({farmersWithCrops.length})
              </button>
              {farmersWithCrops
                .filter(f => f.crops.length > 1)
                .sort((a, b) => b.crops.length - a.crops.length)
                .map(farmerData => (
                  <button
                    key={farmerData.farmer._id}
                    style={{ ...btn.ghost, ...(selectedFarmer === farmerData.farmer._id ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
                    onClick={() => setSelectedFarmer(farmerData.farmer._id)}
                  >
                    {farmerData.farmer.firstName} {farmerData.farmer.lastName} ({farmerData.crops.length} crops)
                  </button>
                ))}
            </div>
          </div>

          {/* Farmers with their crops table */}
          {loading && farmersWithCrops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading farmers...</div>
          ) : farmersWithCrops.length === 0 ? (
            <Empty icon={<i className="bx bx-user" />} message="No farmers with crop relationships found." />
          ) : (
            <DataTable
              columns={['FARMER', 'RSBA NUMBER', 'CROPS PLANTED', 'HARVESTED %', 'TOTAL AREA (HA)', 'DIVERSITY LEVEL', 'ACTIONS']}
              emptyIcon={<i className="bx bx-user" />}
              emptyMsg="No farmers found."
              rows={farmersWithCrops.map(farmerData => (
                <>
                  <TD bold>{farmerData.farmer.firstName} {farmerData.farmer.lastName}</TD>
                  <TD muted>{farmerData.farmer.rsbaNumber}</TD>
                  <TD>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {farmerData.crops.map(fc => (
                        <span key={fc._id} style={{
                          background: '#f0fdf4',
                          color: '#166534',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          border: '1px solid #bbf7d0'
                        }}>
                          {fc.cropId.name}{fc.expectedHarvestDate ? ` (${new Date(fc.expectedHarvestDate).toLocaleDateString()})` : ''}
                        </span>
                      ))}
                    </div>
                  </TD>
                  <TD muted>{farmerHarvestRates[farmerData.farmer._id] != null ? `${farmerHarvestRates[farmerData.farmer._id]}%` : '—'}</TD>
                  <TD>{farmerData.totalArea > 0 ? `${farmerData.totalArea.toFixed(2)} ha` : '—'}</TD>
                  <TD>
                    <span style={{
                      background: farmerData.crops.length > 1 ? '#fef3c7' : '#f3f4f6',
                      color: farmerData.crops.length > 1 ? '#92400e' : '#374151',
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {farmerData.crops.length > 1 ? 'Multi-crop' : 'Single-crop'}
                    </span>
                  </TD>
                  <td style={{ padding: '10px 16px' }}>
                    {isCoordinator && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={btn.outline} onClick={() => handleOpenModal(null, null, farmerData.farmer._id)}>
                          Add Crop
                        </button>
                        <button style={btn.ghost} onClick={() => setSelectedFarmer(farmerData.farmer._id)}>
                          View Details
                        </button>
                      </div>
                    )}
                  </td>
                </>
              ))}
            />
          )}
        </>
      )}

      {/* Assign/Edit Modal */}
      {modalOpen && (
        <Modal
          title={editingFarmerCrop ? 'Edit Farmer-Crop Relationship' : 'Assign Crop to Farmer'}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel={editingFarmerCrop ? 'Update' : 'Assign'}
          wide
        >
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
              disabled={!!editingFarmerCrop}
            >
              <option value="">Select a crop</option>
              {crops.map(crop => (
                <option key={crop._id} value={crop._id}>
                  {crop.name} ({crop.scientificName || 'No scientific name'})
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Planting Date">
              <input
                type="date"
                name="plantingDate"
                value={formData.plantingDate}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </Field>

            <Field label="Expected Harvest Date">
              <input
                type="date"
                name="expectedHarvestDate"
                value={formData.expectedHarvestDate}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Area Planted (hectares)">
              <input
                type="number"
                name="areaPlanted"
                value={formData.areaPlanted}
                onChange={handleInputChange}
                style={inputStyle}
                step="0.01"
                placeholder="e.g., 2.5"
              />
            </Field>

            <Field label="Status">
              <select
                name="status"
                value={formData.status || 'Planted'}
                onChange={handleInputChange}
                style={inputStyle}
              >
                <option value="Planted">Planted</option>
                <option value="Growing">Growing</option>
                <option value="Harvested">Harvested</option>
                <option value="Failed">Failed</option>
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              style={{ ...inputStyle, minHeight: 80, fontFamily: 'inherit' }}
              placeholder="Additional notes..."
            />
          </Field>
        </Modal>
      )}
    </>
  );
}
