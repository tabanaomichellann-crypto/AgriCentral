// pages/HeadDashboard.jsx
// Head of Office:
//  - View-only equipment inventory (cannot add/edit/delete)
//  - Final approval gate: sees only Gov_Approved requests
//  - Checks available quantities before approving issuance

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { headDecision } from '../services/equipmentApi';
import {
  useEquipment, useRequests,
  Modal, Field, StatusBadge, StatCard, EquipImage,
  SectionTitle, DataTable, TD, Empty,
  btn, inputStyle,
} from './Shared';
import logo from '../assets/AgriCentral_Logo.png';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Issuance decision modal ────────────────────────────────────────────────
function IssuanceModal({ request, decision, onClose, onDone }) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const available = request.equipment_id?.quantity_available ?? 0;
  const requested = request.quantity_requested;
  const canIssue  = available >= requested;

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await headDecision(request._id, { decision, remarks });
      onDone();
    } catch (err) { setError(err.response?.data?.message || 'Action failed.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal
      title={`${decision === 'Approved' ? 'Issue Equipment' : 'Reject Request'} — Head of Office`}
      onClose={onClose} onSubmit={handleSubmit}
      loading={loading} submitLabel={decision === 'Approved' ? 'Confirm Issuance' : 'Reject'}
    >
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Availability check */}
      <div style={{
        background: canIssue ? '#f0fdf4' : '#fff7ed',
        border: `1px solid ${canIssue ? '#86efac' : '#fed7aa'}`,
        borderRadius: 10, padding: 14, marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <EquipImage imageId={request.equipment_id?.imageId} name={request.equipment_id?.equipment_name} size={52} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{request.equipment_id?.equipment_name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{request.association_id?.associationName}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 13 }}>
          <div style={{ textAlign: 'center', background: '#fff', borderRadius: 8, padding: '8px 0' }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Requested</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#111827' }}>{requested}</div>
          </div>
          <div style={{ textAlign: 'center', background: '#fff', borderRadius: 8, padding: '8px 0' }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Available</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: canIssue ? '#16a34a' : '#dc2626' }}>{available}</div>
          </div>
          <div style={{ textAlign: 'center', background: '#fff', borderRadius: 8, padding: '8px 0' }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>After Issuance</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#374151' }}>{Math.max(0, available - requested)}</div>
          </div>
        </div>
        {!canIssue && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#c2410c', fontWeight: 600 }}>
            ⚠ Insufficient stock — requested quantity exceeds available units.
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280' }}>Purpose: {request.purpose || '—'}</div>
      </div>

      <Field label="Remarks (optional)">
        <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }}
          value={remarks} onChange={e => setRemarks(e.target.value)}
          placeholder={decision === 'Rejected' ? 'Reason for rejection…' : 'Notes for the Program Coordinator…'} />
      </Field>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function HeadDashboard() {
  const navigate = useNavigate();
  const name     = localStorage.getItem('fullName');
  const logout   = () => { localStorage.clear(); navigate('/login'); };
  const [tab, setTab] = useState('Overview');

  const { equipment }         = useEquipment();
  const { requests, reload }  = useRequests();
  const [actionModal, setActionModal] = useState(null);

  const govApproved = requests.filter(r => r.status === 'Gov_Approved');
  const issued      = requests.filter(r => r.status === 'Issued');
  const rejected    = requests.filter(r => r.status === 'Rejected');
  const available   = equipment.filter(e => e.status === 'Available');

  const navItems = [
    { key: 'Overview',  icon: <i className="bx bx-bar-chart-alt-2" />, label: 'Overview'          },
    { key: 'Inventory', icon: <i className="bx bx-package" />, label: 'Equipment Inventory'},
    { key: 'Requests',  icon: <i className="bx bx-list-ol" />, label: 'Equipment Requests' },
  ];

  return (
    <div className="coord-layout">
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
            <div className="coord-user-avatar">{getInitials(name || 'Head')}</div>
            <div>
              <div className="coord-user-name">{name}</div>
              <div className="coord-user-role">Head of Office</div>
            </div>
          </div>
          <button className="coord-logout-btn" onClick={logout}><i className="bx bx-log-out" /> Sign out</button>
        </div>
      </aside>

      <div className="coord-main">
        <div className="coord-topbar">
          <div className="coord-topbar-left">
            <span className="coord-topbar-breadcrumb">
              Dashboard &rsaquo; <span>{navItems.find(n => n.key === tab)?.label}</span>
            </span>
          </div>
          <div className="coord-topbar-right">
            <span className="coord-topbar-badge">Head of Office</span>
          </div>
        </div>
        <div className="coord-body">

          {/* ── OVERVIEW ── */}
          {tab === 'Overview' && (
            <>
              <h2 style={{ margin: '0 0 20px', fontSize: 20, color: '#111827' }}>Head of Office Dashboard</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Awaiting Final Approval" value={govApproved.length} icon={<i className="bx bx-send" />} accent="#7c3aed" />
                <StatCard label="Equipment Types"         value={equipment.length}    icon={<i className="bx bx-package" />} accent="#16a34a" />
                <StatCard label="Available Types"         value={available.length}    icon={<i className="bx bx-check-circle" />} accent="#2563eb" />
                <StatCard label="Total Issued"            value={issued.length}       icon={<i className="bx bx-briefcase" />} accent="#d97706" />
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Your Role</div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
                  As Head of Office, you are the <strong>second and final approval gate</strong>. You review
                  Governor-approved requests, verify stock availability, and authorize official issuance of
                  equipment to farmer associations. You have <strong>read-only</strong> access to the inventory —
                  equipment management is handled by the Program Coordinator.
                </p>
              </div>
            </>
          )}

          {/* ── INVENTORY (read-only) ── */}
          {tab === 'Inventory' && (
            <>
              <SectionTitle title="Equipment Inventory" sub="Read-only view — managed by the Program Coordinator" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                <StatCard label="Total Types"    value={equipment.length}                                          icon={<i className="bx bx-package" />} accent="#374151" />
                <StatCard label="Total Units"    value={equipment.reduce((s, e) => s + e.quantity_total, 0)}      icon={<i className="bx bx-calculator" />} accent="#2563eb" />
                <StatCard label="Available Units" value={equipment.reduce((s, e) => s + e.quantity_available, 0)} icon={<i className="bx bx-check-circle" />} accent="#16a34a" />
              </div>
              {/* Equipment cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
                {equipment.length === 0
                  ? <Empty icon={<i className="bx bx-package" />} message="No equipment found." />
                  : equipment.map(item => (
                    <div key={item._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <EquipImage imageId={item.imageId} name={item.equipment_name} size={56} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{item.equipment_name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>{item.category || '—'}</div>
                        <StatusBadge status={item.status} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10, fontSize: 12 }}>
                          <div style={{ background: '#f9fafb', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                            <div style={{ color: '#9ca3af' }}>Total</div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{item.quantity_total}</div>
                          </div>
                          <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                            <div style={{ color: '#9ca3af' }}>Available</div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: '#16a34a' }}>{item.quantity_available}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* ── REQUESTS ── */}
          {tab === 'Requests' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Awaiting Your Decision" value={govApproved.length} icon={<i className="bx bx-send" />} accent="#7c3aed" />
                <StatCard label="Issued"                 value={issued.length}      icon={<i className="bx bx-briefcase" />} accent="#16a34a" />
                <StatCard label="Rejected"               value={rejected.length}    icon={<i className="bx bx-x-circle" />} accent="#dc2626" />
              </div>

              <SectionTitle title="Governor-Approved Requests" sub="These have passed the Governor's review — your final decision triggers issuance" />
              <DataTable
                columns={['Equipment', 'Photo', 'Association', 'Qty Req.', 'Qty Avail.', 'Purpose', 'Action']}
                emptyIcon={<i className="bx bx-mail-send" />} emptyMsg="No requests awaiting your decision."
                rows={govApproved.map(r => (
                  <>
                    <TD bold>{r.equipment_id?.equipment_name || '—'}</TD>
                    <td style={{ padding: '10px 16px' }}><EquipImage imageId={r.equipment_id?.imageId} name="" size={40} /></td>
                    <TD muted>{r.association_id?.associationName || '—'}</TD>
                    <TD>{r.quantity_requested}</TD>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontWeight: 700, color: (r.equipment_id?.quantity_available ?? 0) >= r.quantity_requested ? '#16a34a' : '#dc2626' }}>
                        {r.equipment_id?.quantity_available ?? '—'}
                      </span>
                    </td>
                    <TD muted>{r.purpose || '—'}</TD>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={btn.approve} onClick={() => setActionModal({ request: r, decision: 'approve' })}>Issue</button>
                        <button style={btn.reject}  onClick={() => setActionModal({ request: r, decision: 'reject' })}>Reject</button>
                      </div>
                    </td>
                  </>
                ))}
              />

              <SectionTitle title="Full Request History" sub="All requests across all stages" />
              <DataTable
                columns={['Equipment', 'Association', 'Qty', 'Status', 'Date']}
                emptyIcon={<i className="bx bx-clipboard" />} emptyMsg="No requests yet."
                rows={requests.map(r => (
                  <>
                    <TD bold>{r.equipment_id?.equipment_name || '—'}</TD>
                    <TD muted>{r.association_id?.associationName || '—'}</TD>
                    <TD>{r.quantity_requested}</TD>
                    <TD><StatusBadge status={r.status} /></TD>
                    <TD muted>{new Date(r.requested_at).toLocaleDateString()}</TD>
                  </>
                ))}
              />
            </>
          )}
        </div>
      </div>

      {actionModal && (
        <IssuanceModal
          request={actionModal.request}
          decision={actionModal.decision}
          onClose={() => setActionModal(null)}
          onDone={() => { setActionModal(null); reload(); }}
        />
      )}
    </div>
  );
}