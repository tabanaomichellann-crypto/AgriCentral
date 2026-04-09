import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipment, createEquipment, deleteEquipment } from '../services/api';
import '../styles/CoordinatorDashboard.css';

const TYPES = [
  { key: 'Hand Tractor',  icon: '🚜' },
  { key: 'Grass Cutter',  icon: '🌿' },
  { key: 'Other',         icon: '🔧' },
];

const STATUS = ['Available', 'In Use', 'Under Maintenance', 'Retired'];

const empty = { name: '', equipmentType: '', serialNumber: '', condition: 'Available', notes: '' };

export default function EquipmentDashboard() {
  const navigate  = useNavigate();
  const fullName  = localStorage.getItem('fullName');
  const logout    = () => { localStorage.clear(); navigate('/login'); };

  const [tab, setTab]           = useState('Hand Tractor');
  const [items, setItems]       = useState([]);
  const [error, setError]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(empty);
  const [modalError, setModalError] = useState('');
  const [loading, setLoading]   = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getEquipment(tab);
      setItems(res.data);
      setError('');
    } catch {
      setError('Failed to load equipment.');
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      await createEquipment({ ...form, equipmentType: tab });
      setShowModal(false); setForm(empty); load();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add equipment.');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this equipment?')) return;
    try { await deleteEquipment(id); load(); }
    catch { setError('Failed to delete.'); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="coord-layout">

      {/* Sidebar */}
      <aside className="coord-sidebar">
        <div className="coord-sidebar-brand">🌾 AgriCentral</div>
        <nav className="coord-nav">
          {TYPES.map(t => (
            <button key={t.key}
              className={`coord-nav-btn${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}>
              <span className="coord-nav-icon">{t.icon}</span>
              {t.key === 'Other' ? 'Other Machinery' : `${t.key}s`}
            </button>
          ))}
        </nav>
        <div className="coord-sidebar-footer">
          <div className="coord-user-info">
            <div className="coord-user-name">{fullName}</div>
            <div className="coord-user-role">Program Coordinator</div>
          </div>
          <button className="coord-logout-btn" onClick={logout}>
            <span className="coord-nav-icon">🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="coord-main">
        <div className="coord-topbar">
          <span className="coord-topbar-title">
            Equipment Inventory — {tab === 'Other' ? 'Other Machinery' : `${tab}s`}
          </span>
        </div>

        <div className="coord-body">
          {error && <div className="coord-error">{error}</div>}

          <div className="coord-page-header">
            <h2>{tab === 'Other' ? 'Other Machinery' : `${tab}s`}</h2>
            <button className="btn-primary-sm" onClick={() => { setModalError(''); setShowModal(true); }}>
              + Add Equipment
            </button>
          </div>

          <div className="coord-card">
            <table className="coord-table">
              <thead>
                <tr>
                  {['Name', 'Serial No.', 'Condition / Status', 'Notes', 'Actions'].map(h =>
                    <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.length === 0
                  ? <tr><td colSpan={5} className="coord-empty">No equipment registered yet.</td></tr>
                  : items.map(item => (
                    <tr key={item._id}>
                      <td>{item.name}</td>
                      <td className="coord-td-muted">{item.serialNumber || '—'}</td>
                      <td>
                        <span className={`badge-proof`}>{item.condition}</span>
                      </td>
                      <td className="coord-td-muted">{item.notes || '—'}</td>
                      <td>
                        <button className="btn-danger-sm" onClick={() => handleDelete(item._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="coord-overlay" onClick={() => setShowModal(false)}>
          <div className="coord-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Equipment</h3>
            {modalError && <div className="coord-modal-error">{modalError}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={f('name')} required placeholder="e.g. Kubota L3408" />
              </div>
              <div className="form-group">
                <label>Serial Number</label>
                <input value={form.serialNumber} onChange={f('serialNumber')} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Condition / Status</label>
                <select value={form.condition} onChange={f('condition')}>
                  {STATUS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input value={form.notes} onChange={f('notes')} placeholder="Optional" />
              </div>
              <div className="coord-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-sm" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}