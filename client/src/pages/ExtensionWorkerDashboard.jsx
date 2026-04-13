// pages/ExtensionWorkerDashboard.jsx
// Agricultural Extension Worker (AEW):
//  - View issued equipment that needs field inspection
//  - Submit condition logs with proof photo (stored in MongoDB)
//  - Track validation status from Program Coordinator

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConditionLog } from '../services/equipmentApi';
import {
  useEquipment, useConditionLogs,
  Modal, Field, StatusBadge, StatCard, EquipImage, ImagePicker,
  SectionTitle, Empty,
  btn, inputStyle, CONDITIONS,
} from './Shared';
import logo from '../assets/AgriCentral_Logo.png';

// ── Condition log form modal ───────────────────────────────────────────────
function LogModal({ equipment, onClose, onDone }) {
  const [form, setForm]           = useState({ equipment_id: '', condition_status: '', remarks: '', proof_image: null });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const selected = equipment.find(e => e._id === form.equipment_id);

  const CONDITION_GUIDE = {
    Good:    { color: '#16a34a', desc: 'Fully functional, no issues observed.' },
    Fair:    { color: '#d97706', desc: 'Functional but shows signs of wear; minor maintenance needed.' },
    Poor:    { color: '#dc2626', desc: 'Partially functional; major maintenance required soon.' },
    Damaged: { color: '#9f1239', desc: 'Not functional or poses safety risk; needs immediate repair.' },
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      // Temporarily send as JSON instead of FormData
      const payload = {
        equipment_id: form.equipment_id,
        condition_status: form.condition_status,
        remarks: form.remarks,
        // proof_image will be added later when multer is working
      };
      await createConditionLog(payload);
      onDone();
    } catch (err) { setError(err.response?.data?.message || 'Failed to submit log.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Submit Field Condition Log" onClose={onClose} onSubmit={handleSubmit}
      loading={loading} submitLabel="Submit Log" wide>
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <Field label="Equipment Inspected">
        <select style={inputStyle} value={form.equipment_id} onChange={e => setForm(p => ({ ...p, equipment_id: e.target.value }))} required>
          <option value="">Select equipment…</option>
          {equipment.map(e => <option key={e._id} value={e._id}>{e.equipment_name} ({e.category})</option>)}
        </select>
      </Field>

      {selected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <EquipImage imageId={selected.imageId} name={selected.equipment_name} size={48} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{selected.equipment_name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{selected.category} · Current status: <strong>{selected.status.replace(/_/g, ' ')}</strong></div>
          </div>
        </div>
      )}

      <Field label="Condition After Field Inspection">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 8 }}>
          {CONDITIONS.map(c => {
            const g = CONDITION_GUIDE[c];
            const sel = form.condition_status === c;
            return (
              <div key={c}
                onClick={() => setForm(p => ({ ...p, condition_status: c }))}
                style={{
                  border: `2px solid ${sel ? g.color : '#e5e7eb'}`,
                  background: sel ? `${g.color}15` : '#fff',
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: sel ? g.color : '#374151' }}>{c}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{g.desc}</div>
              </div>
            );
          })}
        </div>
        {/* Hidden required input for form validation */}
        <input type="text" value={form.condition_status} onChange={() => {}} required style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }} />
      </Field>

      <Field label="Detailed Remarks / Observations">
        <textarea style={{ ...inputStyle, height: 100, resize: 'vertical' }}
          value={form.remarks}
          onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
          placeholder="Describe what you observed during field inspection. Include any specific issues, parts in need of repair, or recommended actions…"
          required />
      </Field>

      {/* Proof photo — stored in MongoDB */}
      <ImagePicker
        label="Proof Photo (stored in MongoDB — required for documentation)"
        value={form.proof_image}
        onChange={file => setForm(p => ({ ...p, proof_image: file }))}
      />

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 10, fontSize: 12, color: '#1d4ed8' }}>
        ℹ This log will be submitted for <strong>validation by the Program Coordinator</strong>. Upload a clear photo of the equipment as proof.
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function ExtensionWorkerDashboard() {
  const navigate = useNavigate();
  const name     = localStorage.getItem('fullName');
  const logout   = () => { localStorage.clear(); navigate('/login'); };
  const [tab, setTab] = useState('Inspection');

  const { equipment }       = useEquipment();
  const { logs, reload }    = useConditionLogs();
  const [showLogModal, setShowLogModal] = useState(false);

  const myLogs      = logs; // Backend filters to current user
  const validated   = myLogs.filter(l => l.validated);
  const unvalidated = myLogs.filter(l => !l.validated);

  const COND_COLOR = { Good: '#16a34a', Fair: '#d97706', Poor: '#dc2626', Damaged: '#9f1239' };

  const navItems = [
    { key: 'Inspection', icon: <i className="bx bx-search" />, label: 'Field Inspection' },
    { key: 'Logs',       icon: <i className="bx bx-note" />, label: 'My Logs'          },
  ];

  return (
    <div className="coord-layout">
      <aside className="coord-sidebar">
        <div className="coord-sidebar-brand"><img src={logo} alt="AgriCentral Logo" className="dashboard-logo" /> AgriCentral</div>
        <nav className="coord-nav">
          {navItems.map(n => (
            <button key={n.key} className={`coord-nav-btn${tab === n.key ? ' active' : ''}`} onClick={() => setTab(n.key)}>
              <span className="coord-nav-icon">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="coord-sidebar-footer">
          <div className="coord-user-info">
            <div className="coord-user-name">{name}</div>
            <div className="coord-user-role">Extension Worker (AEW)</div>
          </div>
          <button className="coord-logout-btn" onClick={logout}><i className="bx bx-log-out" /> Sign out</button>
        </div>
      </aside>

      <div className="coord-main">
        <div className="coord-topbar"><span className="coord-topbar-title">{navItems.find(n => n.key === tab)?.label}</span></div>
        <div className="coord-body">

          {/* ── FIELD INSPECTION ── */}
          {tab === 'Inspection' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Logs Submitted" value={myLogs.length}    icon={<i className="bx bx-note" />} accent="#374151" />
                <StatCard label="Awaiting Validation"  value={unvalidated.length} icon={<i className="bx bx-time" />} accent="#d97706" />
                <StatCard label="Validated"            value={validated.length}  icon={<i className="bx bx-check-circle" />} accent="#16a34a" />
              </div>

              {/* Role explanation */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Your Responsibilities</div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>
                  As an Agricultural Extension Worker, you are responsible for <strong>field inspection</strong> of issued equipment.
                  After equipment is issued to a farmer association, you visit the site, assess the equipment condition,
                  document your findings with a photo, and submit a <strong>condition log</strong>.
                  The Program Coordinator then validates your report.
                </p>
              </div>

              {/* Equipment overview cards */}
              <SectionTitle
                title="Equipment to Inspect"
                sub="All equipment registered in the system"
                action={<button style={btn.primary} onClick={() => setShowLogModal(true)}>+ Submit Condition Log</button>}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                {equipment.map(item => (
                  <div key={item._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <EquipImage imageId={item.imageId} name={item.equipment_name} size={44} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{item.equipment_name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.category}</div>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                    <div style={{ marginTop: 10, fontSize: 11, color: '#6b7280' }}>
                      {item.quantity_total - item.quantity_available} in use · {item.quantity_available} available
                    </div>
                  </div>
                ))}
                {equipment.length === 0 && <Empty icon={<i className="bx bx-box" />} message="No equipment registered." />}
              </div>
            </>
          )}

          {/* ── MY LOGS ── */}
          {tab === 'Logs' && (
            <>
              <SectionTitle
                title="My Condition Logs"
                sub="Field inspection reports you have submitted"
                action={<button style={btn.primary} onClick={() => setShowLogModal(true)}>+ New Log</button>}
              />

              {myLogs.length === 0
                ? <Empty icon={<i className="bx bx-note" />} message="You have not submitted any condition logs yet." />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {myLogs.map(l => (
                      <div key={l._id} style={{
                        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18,
                        borderLeft: `4px solid ${COND_COLOR[l.condition_status] || '#e5e7eb'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <EquipImage imageId={l.equipment_id?.imageId} name={l.equipment_id?.equipment_name} size={48} />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{l.equipment_id?.equipment_name || '—'}</div>
                              <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(l.recorded_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                            <StatusBadge status={l.condition_status} />
                            <span style={{
                              fontSize: 11, fontWeight: 700,
                              color: l.validated ? '#16a34a' : '#d97706',
                            }}>
                              {l.validated ? '✓ Validated by Coordinator' : '⏳ Awaiting validation'}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: 12, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                          {l.remarks || <span style={{ color: '#9ca3af' }}>No remarks provided.</span>}
                        </div>

                        {/* Proof photo */}
                        {l.proofImageId && (
                          <div style={{ marginTop: 12 }}>
                            <a href={`/api/images/${l.proofImageId}`} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
                              <i className="bx bx-camera" style={{ fontSize: 14 }}></i> View proof photo
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {showLogModal && (
        <LogModal
          equipment={equipment}
          onClose={() => setShowLogModal(false)}
          onDone={() => { setShowLogModal(false); reload(); }}
        />
      )}
    </div>
  );
}