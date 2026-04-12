// pages/CoordinatorDashboard.jsx
// Added: Equipment tab with full CRUD (name, category, image → MongoDB),
//        all request monitoring, and AEW condition log validation.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFarmers, createFarmer, deleteFarmer,
  getAssociations, createAssociation, deleteAssociation,
  getMembers, addMember, removeMember,
} from '../services/api';
import CropPage from './crop/CropPage';
import logo from '../assets/AgriCentral_Logo.png';
import {
  createEquipment, updateEquipment, deleteEquipment,
  validateConditionLog,
} from '../services/equipmentApi';
import {
  createLivestock, updateLivestock, deleteLivestock,
} from '../services/livestockApi';
import {
  useEquipment, useRequests, useConditionLogs, useLivestock, useLivestockRequests,
  Modal, Field, ImagePicker, StatusBadge, EquipImage, StatCard,
  SectionTitle, DataTable, TD, Empty,
  btn, inputStyle, CATEGORIES, EQUIP_STATUSES,
} from './Shared';
import '../styles/CoordinatorDashboard.css';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const PROOF_TYPES = ['Ownership', 'Tenancy', 'Agreement'];

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const name     = localStorage.getItem('fullName');
  const logout   = () => { localStorage.clear(); navigate('/login'); };
  const [tab, setTab] = useState('Farmers');

  // ── Farmers state ──────────────────────────────────────────────────────
  const [farmers, setFarmers]       = useState([]);
  const [assocs, setAssocs]         = useState([]);
  const [showFarmer, setShowFarmer] = useState(false);
  const [showAssoc, setShowAssoc]   = useState(false);
  const [showMembers, setShowMembers]   = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedAssoc, setSelectedAssoc] = useState(null);
  const [members, setMembers]       = useState([]);
  const [addMemberFarmerId, setAddMemberFarmerId] = useState('');
  const [farmerForm, setFarmerForm] = useState({ rsbaNumber: '', firstName: '', lastName: '', contactNumber: '', address: '', proofOfOwnershipType: '', validIdRef: '' });
  const [assocForm, setAssocForm]   = useState({ associationName: '', address: '', presidentName: '' });

  // ── Equipment state ────────────────────────────────────────────────────
  const { equipment, reload: reloadEquip } = useEquipment();
  const { requests }                       = useRequests();
  const { logs, reload: reloadLogs }       = useConditionLogs();
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [editItem, setEditItem]            = useState(null);
  const [equipForm, setEquipForm]          = useState({ equipment_name: '', category: '', quantity_total: 0, quantity_available: 0, status: 'Available', image: null });

  // ── Livestock state ───────────────────────────────────────────────────
  const { livestock, reload: reloadLivestock } = useLivestock();
  const { requests: livestockRequests }        = useLivestockRequests();
  const [showLivestockModal, setShowLivestockModal] = useState(false);
  const [editLivestock, setEditLivestock]      = useState(null);
  const [livestockForm, setLivestockForm]      = useState({ name: '', type: '', quantity_total: 0, quantity_available: 0, status: 'Ready_For_Dispersal', image: null, notes: '' });

  // ── Shared ─────────────────────────────────────────────────────────────
  const [error, setError]           = useState('');
  const [modalError, setModalError] = useState('');
  const [loading, setLoading]       = useState(false);
  const [livestockTab, setLivestockTab] = useState('Inventory');

  const loadAll = useCallback(async () => {
    try {
      const [f, a] = await Promise.all([getFarmers(), getAssociations()]);
      setFarmers(f.data); setAssocs(a.data);
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
      setShowAssoc(false); setAssocForm({ associationName: '', address: '', presidentName: '' });
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

  // ── Livestock handlers ────────────────────────────────────────────────
  const openAddLivestock = () => {
    setEditLivestock(null);
    setLivestockForm({ name: '', type: '', quantity_total: 0, quantity_available: 0, status: 'Ready_For_Dispersal', image: null, notes: '' });
    setModalError(''); setShowLivestockModal(true);
  };

  const openEditLivestock = (item) => {
    setEditLivestock(item);
    setLivestockForm({ name: item.name, type: item.type || '', quantity_total: item.quantity_total, quantity_available: item.quantity_available, status: item.status, image: null, notes: item.notes || '' });
    setModalError(''); setShowLivestockModal(true);
  };

  const handleSaveLivestock = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      const payload = {
        name: livestockForm.name,
        type: livestockForm.type,
        quantity_total: Number(livestockForm.quantity_total),
        quantity_available: Number(livestockForm.quantity_available),
        status: livestockForm.status,
        notes: livestockForm.notes,
      };

      if (editLivestock) await updateLivestock(editLivestock._id, payload);
      else                await createLivestock(payload);

      setShowLivestockModal(false); reloadLivestock();
    } catch (err) { setModalError(err.response?.data?.message || 'Failed to save livestock.'); }
    finally { setLoading(false); }
  };

  const handleDeleteLivestock = async (id) => {
    if (!window.confirm('Delete this livestock?')) return;
    try { await deleteLivestock(id); reloadLivestock(); }
    catch { setError('Failed to delete livestock.'); }
  };

  // ── Nav ────────────────────────────────────────────────────────────────
  const navItems = [
    { key: 'Farmers',      icon: <i className="bx bx-user" />, label: 'Farmers'      },
    { key: 'Associations', icon: <i className="bx bx-group" />, label: 'Associations'  },
    { key: 'Equipment',    icon: <i className="bx bx-briefcase" />, label: 'Equipment'     },
    { key: 'Livestock',    icon: <i className="bx bx-paw" />, label: 'Livestock'     },
    { key: 'Crops',        icon: <i className="bx bx-leaf" />, label: 'Crops'         },
  ];

  const ef = k => e => setEquipForm(p => ({ ...p, [k]: e.target.value }));
  const lf = k => e => setLivestockForm(p => ({ ...p, [k]: e.target.value }));
  const ff = k => e => setFarmerForm(p => ({ ...p, [k]: e.target.value }));
  const af = k => e => setAssocForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="coord-layout">
      {/* Sidebar */}
      <aside className="coord-sidebar">
        <div className="coord-sidebar-brand"><img src={logo} alt="AgriCentral Logo" className="dashboard-logo" /> AgriCentral</div>
        <div className="coord-nav-section-label">Main Menu</div>
        <nav className="coord-nav">
          {navItems.map(n => (
            <button key={n.key} className={`coord-nav-btn${tab === n.key ? ' active' : ''}`} onClick={() => setTab(n.key)}>
              <span className="coord-nav-icon">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="coord-sidebar-footer">
          <div className="coord-user-card">
            <div className="coord-user-avatar">{getInitials(name)}</div>
            <div>
              <div className="coord-user-name">{name}</div>
              <div className="coord-user-role">Program Coordinator</div>
            </div>
          </div>
          <button className="coord-logout-btn" onClick={logout}><i className="bx bx-log-out" /> Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="coord-main">
        <div className="coord-topbar">
          <div className="coord-topbar-left">
            <span className="coord-topbar-breadcrumb">
              Dashboard &rsaquo; <span>{tab}</span>
            </span>
          </div>
          <div className="coord-topbar-right">
            <span className="coord-topbar-badge">Program Coordinator</span>
          </div>
        </div>
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
                          <td>{a.presidentName || a.presidentUserId?.fullName || '—'}</td>
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
                <StatCard label="Total Types"     value={equipment.length}                                              icon={<i className="bx bx-package" />} accent="#16a34a" />
                <StatCard label="Available Units" value={equipment.reduce((s, e) => s + e.quantity_available, 0)}      icon={<i className="bx bx-check-circle" />} accent="#2563eb" />
                <StatCard label="Pending Requests" value={requests.filter(r => r.status === 'Pending').length}         icon={<i className="bx bx-time" />} accent="#d97706" />
                <StatCard label="Logs to Validate" value={logs.filter(l => !l.validated).length}                      icon={<i className="bx bx-search" />} accent="#7c3aed" />
              </div>

              {/* Equipment inventory */}
              <SectionTitle
                title="Equipment Inventory"
                sub="All agricultural equipment with image stored in MongoDB"
                action={<button style={btn.primary} onClick={openAddEquip}>+ Add Equipment</button>}
              />
              <DataTable
                columns={['', 'Name', 'Category', 'Total', 'Available', 'Status', 'Actions']}
                emptyIcon={<i className="bx bx-box" />} emptyMsg="No equipment added yet."
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
                emptyIcon={<i className="bx bx-clipboard" />} emptyMsg="No requests submitted yet."
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
                emptyIcon={<i className="bx bx-notepad" />} emptyMsg="No condition logs yet."
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

          {/* ── LIVESTOCK TAB ── */}
          {tab === 'Livestock' && (
            <>
              <div className="coord-page-header">
                <h2>Livestock Management</h2>
                <p>Monitor herd inventory and review livestock distribution requests.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                {['Inventory', 'Requests'].map(item => (
                  <button
                    key={item}
                    type="button"
                    style={{
                      ...btn.ghost,
                      ...(livestockTab === item ? { background: '#ecfdf5', color: '#166534', borderColor: '#86efac' } : {}),
                    }}
                    onClick={() => setLivestockTab(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {livestockTab === 'Inventory' ? (
                <>
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                    <StatCard label="Total Breeds" value={livestock.length} icon={<i className="bx bx-paw" />} accent="#16a34a" />
                    <StatCard label="Available Heads" value={livestock.reduce((s, l) => s + l.quantity_available, 0)} icon={<i className="bx bx-check-circle" />} accent="#2563eb" />
                    <StatCard label="Total Heads" value={livestock.reduce((s, l) => s + l.quantity_total, 0)} icon={<i className="bx bx-bar-chart" />} accent="#7c3aed" />
                    <StatCard label="Pending Requests" value={livestockRequests.filter(r => r.status === 'Pending').length} icon={<i className="bx bx-time" />} accent="#d97706" />
                  </div>

                  {/* Livestock inventory */}
                  <SectionTitle
                    title="Livestock Inventory"
                    sub="All animal stocks with herd management"
                    action={<button style={btn.primary} onClick={openAddLivestock}>+ Add Livestock</button>}
                  />
                  <DataTable
                    columns={['Breed', 'Type', 'Total', 'Available', 'Status', 'Actions']}
                    emptyIcon={<i className="bx bx-paw" />} emptyMsg="No livestock added yet."
                    rows={livestock.map(item => (
                      <>
                        <TD bold>{item.name}</TD>
                        <TD muted>{item.type || '—'}</TD>
                        <TD>{item.quantity_total}</TD>
                        <TD>{item.quantity_available}</TD>
                        <TD><StatusBadge status={item.status} /></TD>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button style={btn.outline} onClick={() => openEditLivestock(item)}>Edit</button>
                            <button style={btn.danger}  onClick={() => handleDeleteLivestock(item._id)}>Delete</button>
                          </div>
                        </td>
                      </>
                    ))}
                  />
                </>
              ) : (
                <>
                  {/* Livestock requests */}
                  <SectionTitle title="Livestock Distribution Requests" sub="All livestock dispersal requests" />
                  <DataTable
                    columns={['Livestock', 'Type', 'Qty', 'Requester', 'Status', 'Requested']}
                    emptyIcon={<i className="bx bx-clipboard" />} emptyMsg="No livestock requests yet."
                    rows={livestockRequests.map(r => (
                      <>
                        <TD bold>{r.livestock_id?.name || '—'}</TD>
                        <TD muted>{r.livestock_id?.type || '—'}</TD>
                        <TD>{r.quantity_requested}</TD>
                        <TD muted>{r.farmer_id?.fullName || '—'}</TD>
                        <TD><StatusBadge status={r.status} /></TD>
                        <TD muted>{new Date(r.createdAt).toLocaleDateString()}</TD>
                      </>
                    ))}
                  />
                </>
              )}
            </>
          )}

          {/* ── CROPS TAB ── */}
          {tab === 'Crops' && (
            <CropPage />
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
          <Field label="President Name">
            <input
              style={inputStyle}
              type="text"
              value={assocForm.presidentName}
              onChange={af('presidentName')}
              placeholder="Enter the association president name"
              required
            />
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

      {/* ── Livestock Modal ── */}
      {showLivestockModal && (
        <Modal title={editLivestock ? 'Edit Livestock' : 'Add Livestock'} onClose={() => setShowLivestockModal(false)}
          onSubmit={handleSaveLivestock} loading={loading} submitLabel={editLivestock ? 'Update' : 'Save'}>
          {modalError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{modalError}</div>}
          <Field label="Breed/Livestock Name">
            <input style={inputStyle} value={livestockForm.name} onChange={lf('name')} required placeholder="e.g. Holstein Cattle, Brahman Cross" />
          </Field>
          <Field label="Type">
            <select style={inputStyle} value={livestockForm.type} onChange={lf('type')} required>
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
              <input style={inputStyle} type="number" min={0} value={livestockForm.quantity_total} onChange={lf('quantity_total')} required />
            </Field>
            <Field label="Available Heads">
              <input style={inputStyle} type="number" min={0} value={livestockForm.quantity_available} onChange={lf('quantity_available')} required />
            </Field>
          </div>
          <Field label="Status">
            <select style={inputStyle} value={livestockForm.status} onChange={lf('status')}>
              <option value="Ready_For_Dispersal">Ready For Dispersal</option>
              <option value="Under_Quarantine">Under Quarantine</option>
              <option value="Breeding">Breeding</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </Field>
          <Field label="Notes">
            <textarea style={{ ...inputStyle, minHeight: 80 }} value={livestockForm.notes} onChange={lf('notes')} placeholder="Add any notes about this livestock…" />
          </Field>
        </Modal>
      )}
    </div>
  );
}