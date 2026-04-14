import { useState } from 'react';
import cowIcon from '../../assets/cow-icon.svg';
import {
  useLivestock, Modal, StatusBadge, StatCard, EquipImage,
  SectionTitle, DataTable, TD, btn, Field, inputStyle,
} from '../Shared';
import {
  createLivestock, updateLivestock, deleteLivestock,
} from '../../services/livestockApi';

const INITIAL_FORM = {
  name: '',
  type: '',
  quantity_total: 0,
  quantity_available: 0,
  status: 'Ready_For_Dispersal',
  notes: '',
};

export default function LivestockPage() {
  const { livestock, reload } = useLivestock();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [detailItem, setDetailItem] = useState(null);

  const available = livestock.filter(item => item.status === 'Ready_For_Dispersal' && item.quantity_available > 0);
  const categories = [...new Set(livestock.map(item => item.type).filter(Boolean))];
  const filtered = livestock.filter(item => !categoryFilter || item.type === categoryFilter);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const openAdd = () => {
    setEditItem(null);
    setForm(INITIAL_FORM);
    setModalError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      type: item.type || '',
      quantity_total: item.quantity_total,
      quantity_available: item.quantity_available,
      status: item.status,
      notes: item.notes || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const updateField = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModalError('');

    try {
      const payload = {
        name: form.name,
        type: form.type,
        quantity_total: Number(form.quantity_total),
        quantity_available: Number(form.quantity_available),
        status: form.status,
        notes: form.notes,
      };

      if (editItem) {
        await updateLivestock(editItem._id, payload);
      } else {
        await createLivestock(payload);
      }

      setShowModal(false);
      setForm(INITIAL_FORM);
      reload();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save livestock.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    setLoading(true);

    try {
      await deleteLivestock(item._id);
      reload();
    } catch (err) {
      setModalError('Failed to delete livestock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="coord-body">
      <div className="coord-page-header" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={cowIcon} alt="Cow icon" style={{ width: 32, height: 32, color: '#16a34a' }} />
          <h2 style={{ margin: 0 }}>Livestock Inventory</h2>
        </div>
        <p>Browse livestock stocks, monitor availability, and review herd details.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Breeds" value={livestock.length} icon={<i className="bx bxs-cow" />} accent="#16a34a" />
        <StatCard label="Available Heads" value={available.reduce((sum, item) => sum + item.quantity_available, 0)} icon={<i className="bx bx-check-circle" />} accent="#2563eb" />
        <StatCard label="Types" value={categories.length} icon={<i className="bx bx-folder" />} accent="#7c3aed" />
        <StatCard label="Non-Available" value={livestock.filter(item => item.status !== 'Ready_For_Dispersal').length} icon={<i className="bx bx-alert-triangle" />} accent="#f59e0b" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            style={{ ...btn.ghost, ...(categoryFilter === '' ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
            onClick={() => setCategoryFilter('')}
          >
            All Breeds
          </button>
          {categories.map(type => (
            <button
              key={type}
              style={{ ...btn.ghost, ...(categoryFilter === type ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
              onClick={() => setCategoryFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <button style={btn.primary} onClick={openAdd}>
          + Add Livestock
        </button>
      </div>

      <SectionTitle
        title="Livestock Inventory"
        sub="All animal stocks stored in MongoDB"
      />

      <DataTable
        columns={['Photo', 'Breed', 'Type', 'Total', 'Available', 'Status', 'Actions']}
        emptyIcon={<i className="bx bxs-cow" style={{ fontSize: 20 }} />}
        emptyMsg="No livestock inventory available."
        rows={filtered.map(item => (
          <>
            <td style={{ padding: '10px 16px' }}><EquipImage imageId={item.imageId} name={item.name} size={40} /></td>
            <TD bold>{item.name}</TD>
            <TD muted>{item.type || '—'}</TD>
            <TD>{item.quantity_total}</TD>
            <TD>{item.quantity_available}</TD>
            <TD><StatusBadge status={item.status} /></TD>
            <td style={{ padding: '10px 16px' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={btn.outline} onClick={() => setDetailItem(item)}>Details</button>
                <button style={btn.outline} onClick={() => openEdit(item)}>Edit</button>
                <button style={btn.danger} onClick={() => handleDelete(item)}>Delete</button>
              </div>
            </td>
          </>
        ))}
      />

      {detailItem && (
        <Modal title="Livestock Details" onClose={() => setDetailItem(null)}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            <EquipImage imageId={detailItem.imageId} name={detailItem.name} size={120} />
            <div style={{ minWidth: 220, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 4 }}>{detailItem.name}</div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>{detailItem.type}</div>
              <StatusBadge status={detailItem.status} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Total Heads', value: detailItem.quantity_total, icon: <i className="bx bx-layer" /> },
              { label: 'Available', value: detailItem.quantity_available, icon: <i className="bx bx-check-circle" /> },
              { label: 'In Use', value: detailItem.quantity_total - detailItem.quantity_available, icon: <i className="bx bx-user-check" /> },
              { label: 'Status', value: detailItem.status.replace(/_/g, ' '), icon: <i className="bx bx-shield-quarter" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, color: '#6b7280' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', fontSize: 16 }}>{icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                </div>
                <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#111827' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Notes</div>
            <div style={{ fontSize: 14, color: '#374151' }}>{detailItem.notes || 'No notes available for this herd.'}</div>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal
          title={editItem ? 'Edit Livestock' : 'Add Livestock'}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
          loading={loading}
          submitLabel={editItem ? 'Update' : 'Save'}
        >
          {modalError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {modalError}
            </div>
          )}
          <Field label="Breed/Livestock Name">
            <input style={inputStyle} value={form.name} onChange={updateField('name')} required placeholder="e.g. Holstein Cattle" />
          </Field>
          <Field label="Type">
            <select style={inputStyle} value={form.type} onChange={updateField('type')} required>
              <option value="">Select type…</option>
              <option>Cattle</option>
              <option>Swine</option>
              <option>Poultry</option>
              <option>Goat</option>
              <option>Sheep</option>
              <option>Fish</option>
              <option>Other</option>
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Total Heads">
              <input style={inputStyle} type="number" min={0} value={form.quantity_total} onChange={updateField('quantity_total')} required />
            </Field>
            <Field label="Available Heads">
              <input style={inputStyle} type="number" min={0} value={form.quantity_available} onChange={updateField('quantity_available')} required />
            </Field>
          </div>
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={updateField('status')}>
              <option value="Ready_For_Dispersal">Ready For Dispersal</option>
              <option value="Under_Quarantine">Under Quarantine</option>
              <option value="Breeding">Breeding</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </Field>
          <Field label="Notes">
            <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.notes} onChange={updateField('notes')} placeholder="Add any notes about this livestock…" />
          </Field>
        </Modal>
      )}
    </div>
  );
}