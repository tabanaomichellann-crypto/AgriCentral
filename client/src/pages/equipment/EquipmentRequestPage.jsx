// EquipmentRequestPage.jsx - Equipment request management
// Shows pending/approved/rejected requests based on user role

import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  useRequests,
  Modal, Field, StatusBadge, StatCard, EquipImage,
  SectionTitle, DataTable, TD, Empty,
  btn, inputStyle, CATEGORIES,
} from '../Shared';

export default function EquipmentRequestPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const { requests, reload } = useRequests(role === 'Farmer Association Representative');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const pending = requests.filter(r => r.status === 'Pending');
  const approved = requests.filter(r => r.status === 'Gov_Approved' || r.status === 'Head_Approved');
  const issued = requests.filter(r => r.status === 'Issued');
  const rejected = requests.filter(r => r.status === 'Rejected');

  const getActiveRole = () => {
    switch (role) {
      case 'Farmer Association Representative': return 'Assoc. Rep';
      case 'Governor Assistant': return 'Governor';
      case 'Head of the Office': return 'Head of Office';
      case 'Program Coordinator': return 'Coordinator';
      default: return null;
    }
  };

  const canApprove = (request) => {
    if (role === 'Governor Assistant' && request.status === 'Pending') return true;
    if (role === 'Head of the Office' && request.status === 'Gov_Approved') return true;
    return false;
  };

  const handleDecision = async (requestId, decision, remarks = '') => {
    try {
      const endpoint = role === 'Governor Assistant' ? 'governorDecision' : 'headDecision';
      const { default: api } = await import('../../services/equipmentApi');
      await api[endpoint](requestId, { decision, remarks });
      reload();
      setSelectedRequest(null);
    } catch (err) {
      console.error('Decision failed:', err);
    }
  };

  return (
    <div className="coord-body">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Requests" value={requests.length} icon="📋" accent="#374151" />
        <StatCard label="Pending" value={pending.length} icon="⏳" accent="#d97706" />
        <StatCard label="Approved" value={approved.length} icon="📤" accent="#2563eb" />
        <StatCard label="Issued" value={issued.length} icon="✅" accent="#16a34a" />
      </div>

      <SectionTitle
        title={role === 'Farmer Association Representative' ? 'My Equipment Requests' : 'Equipment Requests'}
        sub={role === 'Farmer Association Representative'
          ? 'Track the status of your submitted requests'
          : 'Review and process equipment requests'
        }
        action={role === 'Farmer Association Representative' ? (
          <button style={btn.primary} onClick={() => navigate('../equipment')}>
            + New Request
          </button>
        ) : null}
      />

      <DataTable
        columns={['Equipment', 'Photo', 'Qty', 'Requester', 'Status', 'Date', 'Actions']}
        emptyIcon="📋"
        emptyMsg={role === 'Farmer Association Representative'
          ? 'You have not submitted any requests yet.'
          : 'No equipment requests found.'
        }
        rows={requests.map(r => (
          <>
            <TD bold>{r.equipment_id?.equipment_name || '—'}</TD>
            <td style={{ padding: '10px 16px' }}>
              <EquipImage imageId={r.equipment_id?.imageId} name="" size={40} />
            </td>
            <TD>{r.quantity_requested}</TD>
            <TD muted>{r.farmer_id?.fullName || '—'}</TD>
            <TD><StatusBadge status={r.status} /></TD>
            <TD muted>{new Date(r.createdAt).toLocaleDateString()}</TD>
            <td style={{ padding: '8px 16px' }}>
              <button
                style={btn.outline}
                onClick={() => setSelectedRequest(r)}
              >
                View Details
              </button>
              {canApprove(r) && (
                <div style={{ display: 'inline-flex', gap: 4, marginLeft: 8 }}>
                  <button
                    style={btn.approve}
                    onClick={() => handleDecision(r._id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    style={btn.reject}
                    onClick={() => handleDecision(r._id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </td>
          </>
        ))}
      />

      {/* Request detail modal */}
      {selectedRequest && (
        <Modal
          title="Request Details"
          onClose={() => setSelectedRequest(null)}
          wide
        >
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <EquipImage
              imageId={selectedRequest.equipment_id?.imageId}
              name={selectedRequest.equipment_id?.equipment_name}
              size={100}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 4 }}>
                {selectedRequest.equipment_id?.equipment_name}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                {selectedRequest.equipment_id?.category}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <StatusBadge status={selectedRequest.status} />
                <span style={{ fontSize: 14, color: '#6b7280' }}>
                  Requested: {selectedRequest.quantity_requested} units
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Requester</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
                {selectedRequest.farmer_id?.fullName}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                {selectedRequest.farmer_id?.email}
              </div>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Purpose</div>
              <div style={{ fontSize: 14, color: '#111827' }}>
                {selectedRequest.purpose || 'No purpose specified'}
              </div>
            </div>
          </div>

          {/* Approval workflow */}
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
              Approval Status
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: selectedRequest.status !== 'Pending' ? '#dcfce7' : '#fef9c3',
                color: selectedRequest.status !== 'Pending' ? '#166534' : '#854d0e',
                fontSize: 12,
                fontWeight: 600
              }}>
                Governor: {selectedRequest.status === 'Rejected' ? 'Rejected' :
                          selectedRequest.status !== 'Pending' ? 'Approved' : 'Pending'}
              </div>
              <div style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: selectedRequest.status === 'Issued' ? '#dcfce7' :
                           selectedRequest.status === 'Head_Approved' ? '#dbeafe' : '#f3f4f6',
                color: selectedRequest.status === 'Issued' ? '#166534' :
                      selectedRequest.status === 'Head_Approved' ? '#1e40af' : '#6b7280',
                fontSize: 12,
                fontWeight: 600
              }}>
                Head Office: {selectedRequest.status === 'Rejected' ? 'Rejected' :
                             selectedRequest.status === 'Issued' ? 'Approved & Issued' :
                             selectedRequest.status === 'Head_Approved' ? 'Approved' : 'Pending'}
              </div>
            </div>
          </div>

          {/* Remarks */}
          {(selectedRequest.governor_remarks || selectedRequest.head_remarks) && (
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                Remarks
              </div>
              {selectedRequest.governor_remarks && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Governor:</div>
                  <div style={{ fontSize: 14, color: '#111827' }}>{selectedRequest.governor_remarks}</div>
                </div>
              )}
              {selectedRequest.head_remarks && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Head Office:</div>
                  <div style={{ fontSize: 14, color: '#111827' }}>{selectedRequest.head_remarks}</div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons for approvers */}
          {canApprove(selectedRequest) && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                style={btn.reject}
                onClick={() => handleDecision(selectedRequest._id, 'reject', 'Request rejected')}
              >
                Reject Request
              </button>
              <button
                style={btn.approve}
                onClick={() => handleDecision(selectedRequest._id, 'approve')}
              >
                Approve Request
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}