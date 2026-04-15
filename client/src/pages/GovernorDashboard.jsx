import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { governorDecision } from '../services/equipmentApi';
import {
  useRequests,
  Modal, Field, StatusBadge, StatCard, EquipImage,
  SectionTitle, DataTable, TD,
  btn, inputStyle,
} from './Shared';
import logo from '../assets/AgriCentral_Logo.png';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// Approval Modal
function DecisionModal({ request, decision, onClose, onDone }) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await governorDecision(request._id, { decision, remarks });
      onDone();
    } catch (err) { setError(err.response?.data?.message || 'Action failed.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal
      title={`${decision} Request — Governor`}
      onClose={onClose} onSubmit={handleSubmit}
      loading={loading} submitLabel={decision}
    >
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* Request summary */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <EquipImage imageId={request.equipment_id?.imageId} name={request.equipment_id?.equipment_name} size={48} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{request.equipment_id?.equipment_name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{request.association_id?.associationName}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div><span style={{ color: '#9ca3af' }}>Qty Requested: </span><strong>{request.quantity_requested}</strong></div>
          <div><span style={{ color: '#9ca3af' }}>Available: </span><strong>{request.equipment_id?.quantity_available}</strong></div>
          <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#9ca3af' }}>Purpose: </span>{request.purpose || '—'}</div>
        </div>
      </div>

      <Field label="Remarks (optional)">
        <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }}
          value={remarks} onChange={e => setRemarks(e.target.value)}
          placeholder={decision === 'Rejected' ? 'State the reason for rejection…' : 'Optional notes for the Head of Office…'} />
      </Field>
    </Modal>
  );
}

export default function GovernorDashboard() {
  const navigate = useNavigate();
  const name     = localStorage.getItem('fullName');
  const logout   = () => { localStorage.clear(); navigate('/login'); };
  const [tab, setTab] = useState('Overview');

  const { requests, reload } = useRequests();
  const [actionModal, setActionModal] = useState(null); // { request, decision }

  const pending     = requests.filter(r => r.status === 'Pending');
  const govApproved = requests.filter(r => r.status === 'Gov_Approved');
  const rejected    = requests.filter(r => r.status === 'Rejected');

  const navItems = [
    { key: 'Overview',  icon: <i className="bx bx-bar-chart-alt-2" />, label: 'Overview'          },
    { key: 'Equipment', icon: <i className="bx bx-package" />, label: 'Equipment Requests' },
  ];

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
            <div className="coord-user-avatar">{getInitials(name || 'Governor')}</div>
            <div>
              <div className="coord-user-name">{name}</div>
              <div className="coord-user-role">Governor Assistant</div>
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
              Dashboard &rsaquo; <span>{tab === 'Equipment' ? 'Equipment Requests' : 'Overview'}</span>
            </span>
          </div>
          <div className="coord-topbar-right">
            <span className="coord-topbar-badge">Governor Assistant</span>
          </div>
        </div>
        <div className="coord-body">

          {/* ── OVERVIEW ── */}
          {tab === 'Overview' && (
            <>
              <div className="coord-page-header">
                <div>
                  <h2>Governor Dashboard</h2>
                  <p>Review and approve equipment requests from farmer associations.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                <StatCard label="Pending Approval" value={pending.length}     icon={<i className="bx bx-time" />} accent="#d97706" />
                <StatCard label="Approved"          value={govApproved.length} icon={<i className="bx bx-check-circle" />} accent="#16a34a" />
                <StatCard label="Rejected"          value={rejected.length}    icon={<i className="bx bx-x-circle" />} accent="#dc2626" />
              </div>
              <div className="coord-card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 16, background: '#f8fafc' }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#e0f2fe',
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}>
                    <i className="bx bx-shield-quarter" />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Your Role in the Process</div>
                    <p style={{ margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                      As Governor, you are the <strong>first approval gate</strong> for agricultural equipment requests
                      submitted by Farmer Associations. Once approved, requests proceed to the Head of Office for
                      final issuance. Rejected requests are returned to the association.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── EQUIPMENT REQUESTS ── */}
          {tab === 'Equipment' && (
            <>
              <div className="coord-page-header">
                <div>
                  <h2>Equipment Requests</h2>
                  <p>Approve or reject pending requests and monitor processing history.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard label="Awaiting Your Decision" value={pending.length}     icon={<i className="bx bx-time" />} accent="#d97706" />
                <StatCard label="Forwarded to Head"      value={govApproved.length} icon={<i className="bx bx-send" />} accent="#2563eb" />
                <StatCard label="Rejected"               value={rejected.length}    icon={<i className="bx bx-x-circle" />} accent="#dc2626" />
              </div>

              {/* Pending — needs action */}
              <SectionTitle title="Pending Requests" sub="These require your approval or rejection" />
              <DataTable
                columns={['Equipment', 'Photo', 'Association', 'Qty', 'Purpose', 'Submitted', 'Action']}
                emptyIcon={<i className="bx bx-clipboard" />} emptyMsg="No pending requests."
                rows={pending.map(r => (
                  <>
                    <TD bold>{r.equipment_id?.equipment_name || '—'}</TD>
                    <td style={{ padding: '10px 16px' }}><EquipImage imageId={r.equipment_id?.imageId} name={r.equipment_id?.equipment_name} size={40} /></td>
                    <TD muted>{r.association_id?.associationName || '—'}</TD>
                    <TD>{r.quantity_requested}</TD>
                    <TD muted>{r.purpose || '—'}</TD>
                    <TD muted>{new Date(r.createdAt || r.requested_at).toLocaleDateString()}</TD>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={btn.approve} onClick={() => setActionModal({ request: r, decision: 'approve' })}>Approve</button>
                        <button style={btn.reject}  onClick={() => setActionModal({ request: r, decision: 'reject' })}>Reject</button>
                      </div>
                    </td>
                  </>
                ))}
              />

              {/* All requests — history */}
              <SectionTitle title="All Requests History" sub="Complete log of all equipment requests" />
              <DataTable
                columns={['Equipment', 'Association', 'Qty', 'Status', 'Submitted']}
                emptyIcon={<i className="bx bx-clipboard" />} emptyMsg="No requests yet."
                rows={requests.map(r => (
                  <>
                    <TD bold>{r.equipment_id?.equipment_name || '—'}</TD>
                    <TD muted>{r.association_id?.associationName || '—'}</TD>
                    <TD>{r.quantity_requested}</TD>
                    <TD><StatusBadge status={r.status} /></TD>
                    <TD muted>{new Date(r.createdAt || r.requested_at).toLocaleDateString()}</TD>
                  </>
                ))}
              />
            </>
          )}
        </div>
      </div>

      {/* Decision modal */}
      {actionModal && (
        <DecisionModal
          request={actionModal.request}
          decision={actionModal.decision}
          onClose={() => setActionModal(null)}
          onDone={() => { setActionModal(null); reload(); }}
        />
      )}
    </div>
  );
}