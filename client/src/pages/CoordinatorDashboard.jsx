import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFarmers, createFarmer, deleteFarmer,
  getAssociations, createAssociation, deleteAssociation,
  getMembers, addMember, removeMember,
  getFARUsers,
  getEquipment, createEquipment, updateEquipment, deleteEquipment,
} from '../services/api';
import '../styles/CoordinatorDashboard.css';

const PROOF_TYPES = ['Ownership', 'Tenancy', 'Agreement'];
const STATUS      = ['Available', 'In Use', 'Under Maintenance', 'Retired'];
const EQUIP_TYPES = ['Hand Tractor', 'Grass Cutter', 'Other'];

const emptyFarmer = { rsbaNumber: '', firstName: '', lastName: '', contactNumber: '', address: '', proofOfOwnershipType: '', validIdRef: '' };
const emptyAssoc  = { associationName: '', address: '', presidentUserId: '' };
const emptyEquip  = { name: '', serialNumber: '', condition: 'Available', notes: '' };

function Modal({ title, error, onClose, onSubmit, loading, submitLabel = 'Save', children }) {
  return (
    <div className="coord-overlay" onClick={onClose}>
      <div className="coord-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        {error && <div className="coord-modal-error">{error}</div>}
        <form onSubmit={onSubmit}>
          {children}
          <div className="coord-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary-sm" disabled={loading}>
              {loading ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const name     = localStorage.getItem('fullName');
  const logout   = () => { localStorage.clear(); navigate('/login'); };

  const [tab, setTab] = useState('Farmers');

  // Farmers
  const [farmers, setFarmers]           = useState([]);
  const [showFarmer, setShowFarmer]     = useState(false);
  const [farmerForm, setFarmerForm]     = useState(emptyFarmer);

  // Associations
  const [assocs, setAssocs]             = useState([]);
  const [farUsers, setFarUsers]         = useState([]);
  const [showAssoc, setShowAssoc]       = useState(false);
  const [assocForm, setAssocForm]       = useState(emptyAssoc);
  const [showMembers, setShowMembers]   = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedAssoc, setSelectedAssoc] = useState(null);
  const [members, setMembers]           = useState([]);
  const [addMemberFarmerId, setAddMemberFarmerId] = useState('');

  // Equipment
  const [equipTab, setEquipTab]         = useState('Hand Tractor');
  const [equipItems, setEquipItems]     = useState([]);
  const [showEquip, setShowEquip]       = useState(false);
  const [editEquip, setEditEquip]       = useState(null);
  const [equipForm, setEquipForm]       = useState(emptyEquip);

  // Shared
  const [error, setError]               = useState('');
  const [modalError, setModalError]     = useState('');
  const [loading, setLoading]           = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [f, a, u] = await Promise.all([getFarmers(), getAssociations(), getFARUsers()]);
      setFarmers(f.data);
      setAssocs(a.data);
      setFarUsers(u.data);
      setError('');
    } catch {
      setError('Failed to load data.');
    }
  }, []);

  const loadEquipment = useCallback(async () => {
    try {
      const res = await getEquipment(equipTab);
      setEquipItems(res.data);
      setError('');
    } catch {
      setError('Failed to load equipment.');
    }
  }, [equipTab]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (tab === 'Equipment') loadEquipment(); }, [tab, loadEquipment]);

  // Farmer CRUD
  const handleCreateFarmer = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      await createFarmer(farmerForm);
      setShowFarmer(false); setFarmerForm(emptyFarmer); loadAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create farmer.');
    } finally { setLoading(false); }
  };

  const handleDeleteFarmer = async (id) => {
    if (!window.confirm('Delete this farmer?')) return;
    try { await deleteFarmer(id); loadAll(); }
    catch { setError('Failed to delete farmer.'); }
  };

  // Association CRUD
  const handleCreateAssoc = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      await createAssociation(assocForm);
      setShowAssoc(false); setAssocForm(emptyAssoc); loadAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create association.');
    } finally { setLoading(false); }
  };

  const handleDeleteAssoc = async (id) => {
    if (!window.confirm('Delete this association?')) return;
    try { await deleteAssociation(id); loadAll(); }
    catch { setError('Failed to delete association.'); }
  };

  // Members
  const openMembers = async (assoc) => {
    setSelectedAssoc(assoc);
    try {
      const res = await getMembers(assoc._id);
      setMembers(res.data);
      setShowMembers(true);
    } catch { setError('Failed to load members.'); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      await addMember(selectedAssoc._id, { farmerId: addMemberFarmerId });
      const res = await getMembers(selectedAssoc._id);
      setMembers(res.data);
      setAddMemberFarmerId('');
      setShowAddMember(false);
      loadAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add member.');
    } finally { setLoading(false); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await removeMember(selectedAssoc._id, memberId);
      const res = await getMembers(selectedAssoc._id);
      setMembers(res.data);
      loadAll();
    } catch { setError('Failed to remove member.'); }
  };

  // Equipment CRUD
  const openCreateEquip = () => {
    setEditEquip(null); setEquipForm(emptyEquip); setModalError(''); setShowEquip(true);
  };

  const openEditEquip = (item) => {
    setEditEquip(item);
    setEquipForm({ name: item.name, serialNumber: item.serialNumber || '', condition: item.condition, notes: item.notes || '' });
    setModalError(''); setShowEquip(true);
  };

  const closeEquip = () => {
    setShowEquip(false); setEditEquip(null); setEquipForm(emptyEquip); setModalError('');
  };

  const handleSaveEquip = async (e) => {
    e.preventDefault(); setLoading(true); setModalError('');
    try {
      if (editEquip) {
        await updateEquipment(editEquip._id, equipForm);
      } else {
        await createEquipment({ ...equipForm, equipmentType: equipTab });
      }
      closeEquip(); loadEquipment();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save equipment.');
    } finally { setLoading(false); }
  };

  const handleDeleteEquip = async (id) => {
    if (!window.confirm('Delete this equipment?')) return;
    try { await deleteEquipment(id); loadEquipment(); }
    catch { setError('Failed to delete equipment.'); }
  };

  // Helpers
  const ff = (k) => (e) => setFarmerForm(p => ({ ...p, [k]: e.target.value }));
  const af = (k) => (e) => setAssocForm(p => ({ ...p, [k]: e.target.value }));
  const ef = (k) => (e) => setEquipForm(p => ({ ...p, [k]: e.target.value }));

  const closeFarmer  = () => { setShowFarmer(false);  setFarmerForm(emptyFarmer); setModalError(''); };
  const closeAssoc   = () => { setShowAssoc(false);   setAssocForm(emptyAssoc);   setModalError(''); };
  const closeMembers = () => { setShowMembers(false); setSelectedAssoc(null); setMembers([]); setShowAddMember(false); };

  const navItems = [
    { key: 'Farmers',      icon: '👨‍🌾', label: 'Farmers'      },
    { key: 'Associations', icon: '🤝', label: 'Associations'  },
    { key: 'Equipment',    icon: '🚜', label: 'Equipment'     },
  ];

  return (
    <div className="coord-layout">

      {/* Sidebar */}
      <aside className="coord-sidebar">
        <div className="coord-sidebar-brand">🌾 AgriCentral</div>
        <nav className="coord-nav">
          {navItems.map(n => (
            <button key={n.key}
              className={`coord-nav-btn${tab === n.key ? ' active' : ''}`}
              onClick={() => setTab(n.key)}>
              <span className="coord-nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="coord-sidebar-footer">
          <div className="coord-user-info">
            <div className="coord-user-name">{name}</div>
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
          <span className="coord-topbar-title">{tab}</span>
        </div>

        <div className="coord-body">
          {error && <div className="coord-error">{error}</div>}

          {/* Farmers */}
          {tab === 'Farmers' && (
            <>
              <div className="coord-page-header">
                <h2>Registered Farmers</h2>
                <button className="btn-primary-sm" onClick={() => { setModalError(''); setShowFarmer(true); }}>
                  + Add Farmer
                </button>
              </div>
              <div className="coord-card">
                <table className="coord-table">
                  <thead>
                    <tr>
                      {['RSBA No.', 'Name', 'Contact', 'Address', 'Proof of Ownership', 'Registered', 'Actions'].map(h =>
                        <th key={h}>{h}</th>)}
                    </tr>
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
                          <td>
                            <button className="btn-danger-sm" onClick={() => handleDeleteFarmer(f._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Associations */}
          {tab === 'Associations' && (
            <>
              <div className="coord-page-header">
                <h2>Farmer Associations</h2>
                <button className="btn-primary-sm" onClick={() => { setModalError(''); setShowAssoc(true); }}>
                  + Add Association
                </button>
              </div>
              <div className="coord-card">
                <table className="coord-table">
                  <thead>
                    <tr>
                      {['Association Name', 'Address', 'President', 'Members', 'Registered', 'Actions'].map(h =>
                        <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {assocs.length === 0
                      ? <tr><td colSpan={6} className="coord-empty">No associations registered yet.</td></tr>
                      : assocs.map(a => (
                        <tr key={a._id}>
                          <td>{a.associationName}</td>
                          <td className="coord-td-muted">{a.address || '—'}</td>
                          <td>{a.presidentUserId?.fullName || '—'}</td>
                          <td><span className="badge-members">{a.memberCount} members</span></td>
                          <td className="coord-td-muted">{new Date(a.registeredAt).toLocaleDateString()}</td>
                          <td style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-outline-sm" onClick={() => openMembers(a)}>Members</button>
                            <button className="btn-danger-sm" onClick={() => handleDeleteAssoc(a._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Equipment */}
          {tab === 'Equipment' && (
            <>
              <div className="coord-page-header">
                <h2>Equipment Inventory</h2>
                <button className="btn-primary-sm" onClick={openCreateEquip}>+ Add Equipment</button>
              </div>

              {/* Equipment sub-tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
                {EQUIP_TYPES.map(t => (
                  <button key={t}
                    className={equipTab === t ? 'btn-primary-sm' : 'btn-outline-sm'}
                    onClick={() => setEquipTab(t)}>
                    {t === 'Other' ? 'Other Machinery' : `${t}s`}
                  </button>
                ))}
              </div>

              <div className="coord-card">
                <table className="coord-table">
                  <thead>
                    <tr>
                      {['Name', 'Serial No.', 'Status', 'Notes', 'Actions'].map(h =>
                        <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {equipItems.length === 0
                      ? <tr><td colSpan={5} className="coord-empty">No equipment registered yet.</td></tr>
                      : equipItems.map(item => (
                        <tr key={item._id}>
                          <td>{item.name}</td>
                          <td className="coord-td-muted">{item.serialNumber || '—'}</td>
                          <td><span className="badge-proof">{item.condition}</span></td>
                          <td className="coord-td-muted">{item.notes || '—'}</td>
                          <td style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-outline-sm" onClick={() => openEditEquip(item)}>Edit</button>
                            <button className="btn-danger-sm" onClick={() => handleDeleteEquip(item._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Farmer Modal */}
      {showFarmer && (
        <Modal title="Register Farmer" error={modalError} loading={loading}
          onClose={closeFarmer} onSubmit={handleCreateFarmer}>
          <FormField label="RSBA Number">
            <input placeholder="e.g. 0100-0001-000001" value={farmerForm.rsbaNumber} onChange={ff('rsbaNumber')} required />
          </FormField>
          <FormField label="First Name">
            <input value={farmerForm.firstName} onChange={ff('firstName')} required />
          </FormField>
          <FormField label="Last Name">
            <input value={farmerForm.lastName} onChange={ff('lastName')} required />
          </FormField>
          <FormField label="Contact Number">
            <input value={farmerForm.contactNumber} onChange={ff('contactNumber')} />
          </FormField>
          <FormField label="Address">
            <input value={farmerForm.address} onChange={ff('address')} />
          </FormField>
          <FormField label="Proof of Ownership">
            <select value={farmerForm.proofOfOwnershipType} onChange={ff('proofOfOwnershipType')} required>
              <option value="">Select type</option>
              {PROOF_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Valid ID Reference">
            <input value={farmerForm.validIdRef} onChange={ff('validIdRef')} />
          </FormField>
        </Modal>
      )}

      {/* Association Modal */}
      {showAssoc && (
        <Modal title="Create Association" error={modalError} loading={loading}
          onClose={closeAssoc} onSubmit={handleCreateAssoc}>
          <FormField label="Association Name">
            <input value={assocForm.associationName} onChange={af('associationName')} required />
          </FormField>
          <FormField label="Address">
            <input value={assocForm.address} onChange={af('address')} />
          </FormField>
          <FormField label="President (Farmer Association Representative)">
            <select value={assocForm.presidentUserId} onChange={af('presidentUserId')} required>
              <option value="">Select president</option>
              {farUsers.map(u => (
                <option key={u._id} value={u._id}>{u.fullName} ({u.username})</option>
              ))}
            </select>
          </FormField>
        </Modal>
      )}

      {/* Equipment Modal */}
      {showEquip && (
        <Modal
          title={editEquip ? 'Edit Equipment' : 'Add Equipment'}
          error={modalError} loading={loading}
          onClose={closeEquip} onSubmit={handleSaveEquip}
          submitLabel={editEquip ? 'Update' : 'Save'}>
          <FormField label="Name">
            <input value={equipForm.name} onChange={ef('name')} required placeholder="e.g. Kubota L3408" />
          </FormField>
          <FormField label="Serial Number">
            <input value={equipForm.serialNumber} onChange={ef('serialNumber')} placeholder="Optional" />
          </FormField>
          <FormField label="Condition / Status">
            <select value={equipForm.condition} onChange={ef('condition')}>
              {STATUS.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Notes">
            <input value={equipForm.notes} onChange={ef('notes')} placeholder="Optional" />
          </FormField>
        </Modal>
      )}

      {/* Members Modal */}
      {showMembers && selectedAssoc && (
        <div className="coord-overlay" onClick={closeMembers}>
          <div className="coord-modal" style={{ width: 500 }} onClick={e => e.stopPropagation()}>
            <h3>Members — {selectedAssoc.associationName}</h3>

            {showAddMember ? (
              <form onSubmit={handleAddMember}>
                {modalError && <div className="coord-modal-error">{modalError}</div>}
                <FormField label="Select Farmer">
                  <select value={addMemberFarmerId}
                    onChange={e => setAddMemberFarmerId(e.target.value)} required>
                    <option value="">Choose a farmer</option>
                    {farmers
                      .filter(f => !members.some(m => m.farmerId?._id === f._id))
                      .map(f => (
                        <option key={f._id} value={f._id}>
                          {f.firstName} {f.lastName} — {f.rsbaNumber}
                        </option>
                      ))}
                  </select>
                </FormField>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn-primary-sm" disabled={loading}>
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                  <button type="button" className="btn-cancel"
                    onClick={() => { setShowAddMember(false); setModalError(''); }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button className="btn-primary-sm"
                style={{ marginBottom: '1rem' }}
                onClick={() => { setShowAddMember(true); setModalError(''); }}>
                + Add Member
              </button>
            )}

            <div className="members-panel">
              <div className="members-panel-header">
                <span className="members-panel-title">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </span>
              </div>
              {members.length === 0
                ? <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No members yet.</p>
                : members.map(m => (
                  <div key={m._id} className="member-row">
                    <div>
                      <div className="member-name">{m.farmerId?.firstName} {m.farmerId?.lastName}</div>
                      <div className="member-rsba">{m.farmerId?.rsbaNumber}</div>
                    </div>
                    <button className="btn-danger-sm" onClick={() => handleRemoveMember(m._id)}>Remove</button>
                  </div>
                ))}
            </div>

            <div className="coord-modal-footer">
              <button className="btn-cancel" onClick={closeMembers}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}