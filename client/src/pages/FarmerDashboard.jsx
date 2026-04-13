import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEquipmentRequest } from '../services/equipmentApi';
import {
  useEquipment, useRequests,
  Modal, Field, StatusBadge, StatCard, EquipImage,
  SectionTitle, DataTable, TD, Empty,
  btn, inputStyle,
} from './Shared';
import logo from '../assets/AgriCentral_Logo.png';

// Request form modal 
function RequestModal({ equipment, preselect, onClose, onDone }) {
  const [form, setForm] = useState({
    equipment_id: preselect?._id || '',
    quantity_requested: 1,
    purpose: '',
    president_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const selected = equipment.find(e => e._id === form.equipment_id);
  const maxQty   = selected?.quantity_available ?? 99;

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const associationId = localStorage.getItem('associationId');
      const payload = {
        equipment_id: form.equipment_id,
        quantity_requested: form.quantity_requested,
        purpose: form.purpose,
        president_name: form.president_name,
        ...(associationId && { association_id: associationId }),
      };
      await createEquipmentRequest(payload);
      onDone();
    } catch (err) { setError(err.response?.data?.message || 'Failed to submit request.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Request Equipment" onClose={onClose} onSubmit={handleSubmit}
      loading={loading} submitLabel="Submit Request">
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <Field label="Select Equipment">
        <select
          style={inputStyle}
          value={form.equipment_id}
          onChange={e => setForm(p => ({ ...p, equipment_id: e.target.value, quantity_requested: 1 }))}
          required
        >
          <option value="">Choose equipment…</option>
          {equipment.filter(e => e.status === 'Available' && e.quantity_available > 0).map(e => (
            <option key={e._id} value={e._id}>
              {e.equipment_name} — {e.category} (Avail: {e.quantity_available})
            </option>
          ))}
        </select>
      </Field>

      {/* Selected equipment preview */}
      {selected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <EquipImage imageId={selected.imageId} name={selected.equipment_name} size={56} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.equipment_name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{selected.category}</div>
            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
              {selected.quantity_available} units available
            </div>
          </div>
        </div>
      )}

      <Field label={`Quantity Requested${selected ? ` (max: ${maxQty})` : ''}`}>
        <input
          style={inputStyle}
          type="number"
          min={1}
          max={maxQty}
          value={form.quantity_requested}
          onChange={e => setForm(p => ({ ...p, quantity_requested: Number(e.target.value) }))}
          required
        />
      </Field>

      <Field label="President / Representative">
        <input
          style={inputStyle}
          type="text"
          value={form.president_name}
          onChange={e => setForm(p => ({ ...p, president_name: e.target.value }))}
          placeholder="Enter the association president or authorized representative"
          required
        />
      </Field>

      <Field label="Purpose / Justification">
        <textarea
          style={{ ...inputStyle, height: 90, resize: 'vertical' }}
          value={form.purpose}
          onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
          placeholder="Briefly explain why your association needs this equipment and when…"
          required
        />
      </Field>

      <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: 10, fontSize: 12, color: '#854d0e' }}>
        ℹ Your request will be reviewed by the <strong>Governor</strong>, then by the <strong>Head of Office</strong> before issuance.
      </div>
    </Modal>
  );
}

// ── Equipment detail modal ─────────────────────────────────────────────────
function EquipDetailModal({ item, onClose, onRequest }) {
  return (
    <Modal title="Equipment Details" onClose={onClose}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <EquipImage imageId={item.imageId} name={item.equipment_name} size={96} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 4 }}>{item.equipment_name}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{item.category}</div>
          <StatusBadge status={item.status} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[['Total Units', item.quantity_total], ['Available', item.quantity_available]].map(([l, v]) => (
          <div key={l} style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{v}</div>
          </div>
        ))}
      </div>
      {item.status === 'Available' && item.quantity_available > 0 && (
        <button style={{ ...btn.primary, width: '100%' }} onClick={() => { onClose(); onRequest(item); }}>
          Request This Equipment →
        </button>
      )}
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function FarmerDashboard() {
  const navigate  = useNavigate();
  const name      = localStorage.getItem('fullName');
  const assocName = localStorage.getItem('associationName') || 'Your Association';
  const logout    = () => { localStorage.clear(); navigate('/login'); };
  const [tab, setTab] = useState('Equipment');

  const { equipment }        = useEquipment();
  const { requests, reload } = useRequests(true); // my requests only

  const [preselect, setPreselect]           = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [detailItem, setDetailItem]         = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const available  = equipment.filter(e => e.status === 'Available' && e.quantity_available > 0);
  const categories = [...new Set(equipment.map(e => e.category).filter(Boolean))];
  const filtered   = available.filter(e => !categoryFilter || e.category === categoryFilter);

  const openRequest = (item = null) => {
    setPreselect(item);
    setShowRequestModal(true);
  };

  const myPending = requests.filter(r => r.status === 'Pending');
  const myIssued  = requests.filter(r => r.status === 'Issued');

  const navItems = [
    { key: 'Equipment', icon: <i className="bx bx-tractor" />, label: 'Browse Equipment' },
    { key: 'Requests',  icon: <i className="bx bx-clipboard" />, label: 'My Requests'      },
  ];

  return (
    <div className="coord-layout">
      <aside className="coord-sidebar">
        <div className="coord-sidebar-brand"><img src={logo} alt="AgriCentral Logo" className="dashboard-logo" /> AgriCentral</div>
        <nav className="coord-nav">
          {navItems.map(n => (
            <button
              key={n.key}
              className={`coord-nav-btn${tab === n.key ? ' active' : ''}`}
              onClick={() => setTab(n.key)}
            >
              <span className="coord-nav-icon">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="coord-sidebar-footer">
          <div className="coord-user-info">
            <div className="coord-user-name">{name}</div>
            <div className="coord-user-role">Assoc. Representative</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{assocName}</div>
          </div>
          <button className="coord-logout-btn" onClick={logout}><i className="bx bx-log-out" /> Sign out</button>
        </div>
      </aside>

      <div className="coord-main">
        <div className="coord-topbar">
          <span className="coord-topbar-title">{navItems.find(n => n.key === tab)?.label}</span>
        </div>
        <div className="coord-body">

          {/* ── BROWSE EQUIPMENT ── */}
          {tab === 'Equipment' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Available Types" value={available.length} icon={<i className="bx bx-wrench" />} accent="#16a34a" />
                <StatCard label="My Pending Reqs" value={myPending.length} icon={<i className="bx bx-time" />} accent="#d97706" />
                <StatCard label="Issued to Us"    value={myIssued.length}  icon={<i className="bx bx-check-circle" />} accent="#2563eb" />
              </div>

              {/* Category filter + request button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    style={{ ...btn.ghost, ...(categoryFilter === '' ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
                    onClick={() => setCategoryFilter('')}
                  >
                    All
                  </button>
                  {categories.map(c => (
                    <button
                      key={c}
                      style={{ ...btn.ghost, ...(categoryFilter === c ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
                      onClick={() => setCategoryFilter(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <button style={btn.primary} onClick={() => openRequest(null)}>+ New Request</button>
              </div>

              {/* Equipment grid */}
              {filtered.length === 0
                ? <Empty icon={<i className="bx bx-box" />} message="No equipment available in this category." />
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
                    {filtered.map(item => (
                      <div
                        key={item._id}
                        style={{
                          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
                          overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        onClick={() => setDetailItem(item)}
                      >
                        <div style={{ height: 140, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {item.imageId
                            ? <img src={`/api/images/${item.imageId}`} alt={item.equipment_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <i className="bx bx-tractor" style={{ fontSize: 56, color: '#9ca3af' }} />}
                        </div>
                        <div style={{ padding: 14 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 4 }}>{item.equipment_name}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>{item.category}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>{item.quantity_available} available</span>
                            <button
                              style={btn.outline}
                              onClick={e => { e.stopPropagation(); openRequest(item); }}
                            >
                              Request
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </>
          )}

          {/* ── MY REQUESTS ── */}
          {tab === 'Requests' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Requests" value={requests.length}                                                                   icon={<i className="bx bx-clipboard" />} accent="#374151" />
                <StatCard label="Pending"        value={myPending.length}                                                                  icon={<i className="bx bx-time" />} accent="#d97706" />
                <StatCard label="Approved"       value={requests.filter(r => r.status !== 'Pending' && r.status !== 'Rejected').length}    icon={<i className="bx bx-send" />} accent="#2563eb" />
                <StatCard label="Issued"         value={myIssued.length}                                                                   icon={<i className="bx bx-check" />} accent="#16a34a" />
              </div>

              <SectionTitle
                title="My Equipment Requests"
                sub="Track the status of your submitted requests"
                action={<button style={btn.primary} onClick={() => openRequest(null)}>+ New Request</button>}
              />

              <DataTable
                  columns={['Equipment', 'Photo', 'Qty', 'President', 'Purpose', 'Status', 'Submitted']}
                  emptyIcon={<i className="bx bx-clipboard" />} emptyMsg="You have not submitted any requests yet."
                  rows={requests.map(r => (
                    <>
                      <TD bold>{r.equipment_id?.equipment_name || '—'}</TD>
                      <td style={{ padding: '10px 16px' }}>
                        <EquipImage imageId={r.equipment_id?.imageId} name="" size={40} />
                      </td>
                      <TD>{r.quantity_requested}</TD>
                      <TD muted>{r.president_name || '—'}</TD>
                      <TD muted>{r.purpose || '—'}</TD>
                      <TD><StatusBadge status={r.status} /></TD>
                      <TD muted>{new Date(r.createdAt || r.requested_at).toLocaleDateString()}</TD>
                    </>
                  ))}
              />

              {/* Status legend */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Request Status Guide</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8 }}>
                  {[
                    ['Pending',       'Waiting for Governor review'],
                    ['Gov_Approved',  'Governor approved — at Head of Office'],
                    ['Head_Approved', 'Head approved — being issued'],
                    ['Issued',        'Equipment delivered to association'],
                    ['Rejected',      'Request was rejected'],
                  ].map(([s, desc]) => (
                    <div key={s} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <StatusBadge status={s} />
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showRequestModal && (
        <RequestModal
          equipment={equipment}
          preselect={preselect}
          onClose={() => { setShowRequestModal(false); setPreselect(null); }}
          onDone={() => { setShowRequestModal(false); setPreselect(null); reload(); }}
        />
      )}

      {detailItem && (
        <EquipDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onRequest={(item) => { setDetailItem(null); openRequest(item); }}
        />
      )}
    </div>
  );
}