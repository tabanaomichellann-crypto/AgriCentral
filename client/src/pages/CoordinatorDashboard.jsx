// pages/CoordinatorDashboard.jsx
// Added: Equipment tab with full CRUD (name, category, image → MongoDB),
//        all request monitoring, and AEW condition log validation.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFarmers, createFarmer, deleteFarmer,
  getAssociations, createAssociation, deleteAssociation,
  getMembers, addMember, removeMember,
  getFARUsers,
} from '../services/api';
import {
  createEquipment, updateEquipment, deleteEquipment,
  validateConditionLog,
} from '../services/equipmentApi';
import {
  useEquipment, useRequests, useConditionLogs,
  Modal, Field, ImagePicker, StatusBadge, EquipImage, StatCard,
  SectionTitle, DataTable, TD, Empty,
  btn, inputStyle, CATEGORIES, EQUIP_STATUSES,
} from './Shared';
import '../styles/CoordinatorDashboard.css';

const PROOF_TYPES = ['Ownership', 'Tenancy', 'Agreement'];

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const name     = localStorage.getItem('fullName');
  const logout   = () => { localStorage.clear(); navigate('/login'); };
  const [tab, setTab] = useState('Farmers');

  // ── Farmers state ──────────────────────────────────────────────────────
  const [farmers, setFarmers]       = useState([]);
  const [assocs, setAssocs]         = useState([]);
  const [farUsers, setFarUsers]     = useState([]);
  const [showFarmer, setShowFarmer] = useState(false);
  const [showAssoc, setShowAssoc]   = useState(false);
  const [showMembers, setShowMembers]   = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedAssoc, setSelectedAssoc] = useState(null);
  const [members, setMembers]       = useState([]);
  const [addMemberFarmerId, setAddMemberFarmerId] = useState('');
  const [farmerForm, setFarmerForm] = useState({ rsbaNumber: '', firstName: '', lastName: '', contactNumber: '', address: '', proofOfOwnershipType: '', validIdRef: '' });
  const [assocForm, setAssocForm]   = useState({ associationName: '', address: '', presidentUserId: '' });

  // ── Equipment state ────────────────────────────────────────────────────
  const { equipment, reload: reloadEquip } = useEquipment();
  const { requests }                       = useRequests();
  const { logs, reload: reloadLogs }       = useConditionLogs();
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [editItem, setEditItem]            = useState(null);
  const [equipForm, setEquipForm]          = useState({ equipment_name: '', category: '', quantity_total: 0, quantity_available: 0, status: 'Available', image: null });

  // ── Shared ─────────────────────────────────────────────────────────────
  const [error, setError]           = useState('');
  const [modalError, setModalError] = useState('');
  const [loading, setLoading]       = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [f, a, u] = await Promise.all([getFarmers(), getAssociations(), getFARUsers()]);
      setFarmers(f.data); setAssocs(a.data); setFarUsers(u.data);
    } catch { setError('Failed to load data.'); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Farmer handlers ────────────────────────────────────────────────────
  const handleCreateFarmer = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      await createFarmer(farmerForm);
      setShowFarmer(false); setFarmerForm({ rsbaNumber: '', firstName: '', lastName: '', contactNumber: '', address: '', proofOfOwnershipType: '', validIdRef: '' });
      loadAll();
    } catch (err) { setModalError(err.response?.data?.message || 'Failed to create farmer.'); }
    finally { setLoading(false); }
  };

  const handleDeleteFarmer = async (id) => {
    if (!window.confirm('Delete this farmer?')) return;
    try { await deleteFarmer(id); loadAll(); }
    catch { setError('Failed to delete farmer.'); }
  };

  // ── Association handlers ───────────────────────────────────────────────
  const handleCreateAssoc = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      await createAssociation(assocForm);
      setShowAssoc(false); setAssocForm({ associationName: '', address: '', presidentUserId: '' });
      loadAll();
    } catch (err) { setModalError(err.response?.data?.message || 'Failed to create association.'); }
    finally { setLoading(false); }
  };

  const openMembers = async (assoc) => {
    setSelectedAssoc(assoc);
    try { const res = await getMembers(assoc._id); setMembers(res.data); setShowMembers(true); }
    catch { setError('Failed to load members.'); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      await addMember(selectedAssoc._id, { farmerId: addMemberFarmerId });
      const res = await getMembers(selectedAssoc._id);
      setMembers(res.data); setAddMemberFarmerId(''); setShowAddMember(false); loadAll();
    } catch (err) { setModalError(err.response?.data?.message || 'Failed to add member.'); }
    finally { setLoading(false); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try { await removeMember(selectedAssoc._id, memberId); const res = await getMembers(selectedAssoc._id); setMembers(res.data); loadAll(); }
    catch { setError('Failed to remove member.'); }
  };

  // ── Equipment handlers ─────────────────────────────────────────────────
  const openAddEquip = () => {
    setEditItem(null);
    setEquipForm({ equipment_name: '', category: '', quantity_total: 0, quantity_available: 0, status: 'Available', image: null });
    setModalError(''); setShowEquipModal(true);
  };

  const openEditEquip = (item) => {
    setEditItem(item);
    setEquipForm({ equipment_name: item.equipment_name, category: item.category || '', quantity_total: item.quantity_total, quantity_available: item.quantity_available, status: item.status, image: null });
    setModalError(''); setShowEquipModal(true);
  };

  const handleSaveEquip = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      const payload = {
        equipment_name: equipForm.equipment_name,
        category: equipForm.category,
        quantity_total: Number(equipForm.quantity_total),
        quantity_available: Number(equipForm.quantity_available),
        status: equipForm.status,
      };

      if (editItem) await updateEquipment(editItem._id, payload);
      else          await createEquipment(payload);

      setShowEquipModal(false); reloadEquip();
    } catch (err) { setModalError(err.response?.data?.message || 'Failed to save equipment.'); }
    finally { setLoading(false); }
  };

  const handleDeleteEquip = async (id) => {
    if (!window.confirm('Delete this equipment?')) return;
    try { await deleteEquipment(id); reloadEquip(); }
    catch { setError('Failed to delete equipment.'); }
  };

  const handleValidateLog = async (logId) => {
    try { await validateConditionLog(logId); reloadLogs(); }
    catch { setError('Failed to validate log.'); }
  };

  // ── Nav ────────────────────────────────────────────────────────────────
  const navItems = [
    { key: 'Farmers',      icon: '👨‍🌾', label: 'Farmers'      },
    { key: 'Associations', icon: '🤝', label: 'Associations'  },
    { key: 'Equipment',    icon: '🚜', label: 'Equipment'     },
  ];

  const ef = k => e => setEquipForm(p => ({ ...p, [k]: e.target.value }));
  const ff = k => e => setFarmerForm(p => ({ ...p, [k]: e.target.value }));
  const af = k => e => setAssocForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="coord-layout">
      {/* Sidebar */}
      <aside className="coord-sidebar">
        <div className="coord-sidebar-brand">🌾 AgriCentral</div>
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
            <div className="coord-user-role">Program Coordinator</div>
          </div>
          <button className="coord-logout-btn" onClick={logout}>🚪 Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="coord-main">
        <div className="coord-topbar"><span className="coord-topbar-title">{tab}</span></div>
        <div className="coord-body">
          {error && <div className="coord-error">{error}</div>}

          {/* ── FARMERS TAB ── */}
          {tab === 'Farmers' && (
            <>
              <div className="coord-page-header">
                <h2>Registered Farmers</h2>
                <button className="btn-primary-sm" onClick={() => { setModalError(''); setShowFarmer(true); }}>+ Add Farmer</button>
              </div>
              <div className="coord-card">
                <table className="coord-table">
                  <thead>
                    <tr>{['RSBA No.', 'Name', 'Contact', 'Address', 'Proof', 'Registered', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {farmers.length === 0
                      ? <tr><td colSpan={7} className="coord-empty">No farmers registered yet.</td></tr>
                      : farmers.map(f => (
                        <tr key={f._id}>
                          <td className="coord-td-muted">{f.rsbaNumber}</td>
                          <td>{f.firstName} {f.lastName}</td>
                          <td className="coord-td-muted">{f.contactNumber || '—'}</td>
                          <td className="coord-td-muted">{f.address || '—'}</td>
                          <td><span className="badge-proof">{f.proofOfOwnershipType}</span></td>
                          <td className="coord-td-muted">{new Date(f.registeredAt).toLocaleDateString()}</td>
                          <td><button className="btn-danger-sm" onClick={() => handleDeleteFarmer(f._id)}>Delete</button></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ASSOCIATIONS TAB ── */}
          {tab === 'Associations' && (
            <>
              <div className="coord-page-header">
                <h2>Farmer Associations</h2>
                <button className="btn-primary-sm" onClick={() => { setModalError(''); setShowAssoc(true); }}>+ Add Association</button>
              </div>
              <div className="coord-card">
                <table className="coord-table">
                  <thead>
                    <tr>{['Association Name', 'Address', 'President', 'Members', 'Registered', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {assocs.length === 0
                      ? <tr><td colSpan={6} className="coord-empty">No associations yet.</td></tr>
                      : assocs.map(a => (
                        <tr key={a._id}>
                          <td>{a.associationName}</td>
                          <td className="coord-td-muted">{a.address || '—'}</td>
                          <td>{a.presidentUserId?.fullName || '—'}</td>
                          <td><span className="badge-members">{a.memberCount} members</span></td>
                          <td className="coord-td-muted">{new Date(a.registeredAt).toLocaleDateString()}</td>
                          <td style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-outline-sm" onClick={() => openMembers(a)}>Members</button>
                            <button className="btn-danger-sm" onClick={() => deleteAssociation(a._id).then(loadAll)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── EQUIPMENT TAB ── */}
          {tab === 'Equipment' && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Types"     value={equipment.length}                                              icon="📦" accent="#16a34a" />
                <StatCard label="Available Units" value={equipment.reduce((s, e) => s + e.quantity_available, 0)}      icon="✅" accent="#2563eb" />
                <StatCard label="Pending Requests" value={requests.filter(r => r.status === 'Pending').length}         icon="⏳" accent="#d97706" />
                <StatCard label="Logs to Validate" value={logs.filter(l => !l.validated).length}                      icon="🔍" accent="#7c3aed" />
              </div>

              {/* Equipment inventory */}
              <SectionTitle
                title="Equipment Inventory"
                sub="All agricultural equipment with image stored in MongoDB"
                action={<button style={btn.primary} onClick={openAddEquip}>+ Add Equipment</button>}
              />
              <DataTable
                columns={['', 'Name', 'Category', 'Total', 'Available', 'Status', 'Actions']}
                emptyIcon="🚜" emptyMsg="No equipment added yet."
                rows={equipment.map(item => (
                  <> 
                    <TD><EquipImage imageId={item.imageId} name={item.equipment_name} size={44} /></TD>
                    <TD bold>{item.equipment_name}</TD>
                    <TD muted>{item.category || '—'}</TD>
                    <TD>{item.quantity_total}</TD>
                    <TD>{item.quantity_available}</TD>
                    <TD><StatusBadge status={item.status} /></TD>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={btn.outline} onClick={() => openEditEquip(item)}>Edit</button>
                        <button style={btn.danger}  onClick={() => handleDeleteEquip(item._id)}>Delete</button>
                      </div>
                    </td>
                  </>
                ))}
              />

              {/* All requests — monitor only */}
              <SectionTitle title="All Equipment Requests" sub="Full pipeline view — all roles" />
              <DataTable
                columns={['Association', 'Equipment', 'Qty', 'Purpose', 'Status', 'Requested']}
                emptyIcon="📋" emptyMsg="No requests submitted yet."
                rows={requests.map(r => (
                  <>
                    <TD bold>{r.association_id?.associationName || '—'}</TD>
                    <TD>{r.equipment_id?.equipment_name || '—'}</TD>
                    <TD>{r.quantity_requested}</TD>
                    <TD muted>{r.purpose || '—'}</TD>
                    <TD><StatusBadge status={r.status} /></TD>
                    <TD muted>{new Date(r.requested_at).toLocaleDateString()}</TD>
                  </>
                ))}
              />

              {/* Condition logs — validate */}
              <SectionTitle title="AEW Condition Logs" sub="Validate field inspection reports submitted by Extension Workers" />
              <DataTable
                columns={['Equipment', 'Recorded By', 'Condition', 'Remarks', 'Proof Photo', 'Date', 'Action']}
                emptyIcon="📝" emptyMsg="No condition logs yet."
                rows={logs.map(l => (
                  <>
                    <TD bold>{l.equipment_id?.equipment_name || '—'}</TD>
                    <TD muted>{l.recorded_by?.fullName || '—'}</TD>
                    <TD><StatusBadge status={l.condition_status} /></TD>
                    <TD muted>{l.remarks || '—'}</TD>
                    <td style={{ padding: '10px 16px' }}>
                      {l.proofImageId
                        ? <a href={`/api/images/${l.proofImageId}`} target="_blank" rel="noreferrer"
                            style={{ color: '#2563eb', fontSize: 12 }}>View photo</a>
                        : <span style={{ color: '#9ca3af', fontSize: 12 }}>No photo</span>}
                    </td>
                    <TD muted>{new Date(l.recorded_at).toLocaleDateString()}</TD>
                    <td style={{ padding: '10px 16px' }}>
                      {l.validated
                        ? <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>✓ Validated</span>
                        : <button style={btn.approve} onClick={() => handleValidateLog(l._id)}>Validate</button>}
                    </td>
                  </>
                ))}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Equipment Modal ── */}
      {showEquipModal && (
        <Modal title={editItem ? 'Edit Equipment' : 'Add Equipment'} onClose={() => setShowEquipModal(false)}
          onSubmit={handleSaveEquip} loading={loading} submitLabel={editItem ? 'Update' : 'Save'}>
          {modalError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{modalError}</div>}
          <Field label="Equipment Name">
            <input style={inputStyle} value={equipForm.equipment_name} onChange={ef('equipment_name')} required placeholder="e.g. Kubota L3408 Tractor" />
          </Field>
          <Field label="Category">
            <select style={inputStyle} value={equipForm.category} onChange={ef('category')} required>
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Total Quantity">
              <input style={inputStyle} type="number" min={0} value={equipForm.quantity_total} onChange={ef('quantity_total')} required />
            </Field>
            <Field label="Available Quantity">
              <input style={inputStyle} type="number" min={0} value={equipForm.quantity_available} onChange={ef('quantity_available')} required />
            </Field>
          </div>
          <Field label="Status">
            <select style={inputStyle} value={equipForm.status} onChange={ef('status')}>
              {EQUIP_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          {/* Image upload — stored as Buffer/GridFS in MongoDB */}
          <ImagePicker
            label="Equipment Photo (stored in MongoDB)"
            value={equipForm.image}
            onChange={file => setEquipForm(p => ({ ...p, image: file }))}
          />
        </Modal>
      )}

      {/* ── Farmer Modal ── */}
      {showFarmer && (
        <Modal title="Register Farmer" onClose={() => { setShowFarmer(false); setModalError(''); }}
          onSubmit={handleCreateFarmer} loading={loading}>
          {modalError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{modalError}</div>}
          <Field label="RSBA Number"><input style={inputStyle} value={farmerForm.rsbaNumber} onChange={ff('rsbaNumber')} required /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="First Name"><input style={inputStyle} value={farmerForm.firstName} onChange={ff('firstName')} required /></Field>
            <Field label="Last Name"><input style={inputStyle} value={farmerForm.lastName} onChange={ff('lastName')} required /></Field>
          </div>
          <Field label="Contact Number"><input style={inputStyle} value={farmerForm.contactNumber} onChange={ff('contactNumber')} /></Field>
          <Field label="Address"><input style={inputStyle} value={farmerForm.address} onChange={ff('address')} /></Field>
          <Field label="Proof of Ownership">
            <select style={inputStyle} value={farmerForm.proofOfOwnershipType} onChange={ff('proofOfOwnershipType')} required>
              <option value="">Select type</option>
              {PROOF_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Valid ID Reference"><input style={inputStyle} value={farmerForm.validIdRef} onChange={ff('validIdRef')} /></Field>
        </Modal>
      )}

      {/* ── Association Modal ── */}
      {showAssoc && (
        <Modal title="Create Association" onClose={() => { setShowAssoc(false); setModalError(''); }}
          onSubmit={handleCreateAssoc} loading={loading}>
          {modalError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{modalError}</div>}
          <Field label="Association Name"><input style={inputStyle} value={assocForm.associationName} onChange={af('associationName')} required /></Field>
          <Field label="Address"><input style={inputStyle} value={assocForm.address} onChange={af('address')} /></Field>
          <Field label="President (FAR User)">
            <select style={inputStyle} value={assocForm.presidentUserId} onChange={af('presidentUserId')} required>
              <option value="">Select president</option>
              {farUsers.map(u => <option key={u._id} value={u._id}>{u.fullName} ({u.username})</option>)}
            </select>
          </Field>
        </Modal>
      )}

      {/* ── Members Modal ── */}
      {showMembers && selectedAssoc && (
        <Modal title={`Members — ${selectedAssoc.associationName}`} onClose={() => { setShowMembers(false); setSelectedAssoc(null); setMembers([]); setShowAddMember(false); }}>
          {showAddMember ? (
            <form onSubmit={handleAddMember}>
              {modalError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{modalError}</div>}
              <Field label="Select Farmer">
                <select style={inputStyle} value={addMemberFarmerId} onChange={e => setAddMemberFarmerId(e.target.value)} required>
                  <option value="">Choose a farmer</option>
                  {farmers.filter(f => !members.some(m => m.farmerId?._id === f._id)).map(f => (
                    <option key={f._id} value={f._id}>{f.firstName} {f.lastName} — {f.rsbaNumber}</option>
                  ))}
                </select>
              </Field>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={btn.primary} disabled={loading}>{loading ? 'Adding…' : 'Add Member'}</button>
                <button type="button" style={btn.ghost} onClick={() => setShowAddMember(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button style={{ ...btn.primary, marginBottom: 16 }} onClick={() => setShowAddMember(true)}>+ Add Member</button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.length === 0
              ? <Empty icon="👥" message="No members yet." />
              : members.map(m => (
                <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.farmerId?.firstName} {m.farmerId?.lastName}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.farmerId?.rsbaNumber}</div>
                  </div>
                  <button style={btn.danger} onClick={() => handleRemoveMember(m._id)}>Remove</button>
                </div>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}