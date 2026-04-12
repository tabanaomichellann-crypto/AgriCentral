// LivestockRequestPage.jsx - Livestock request management
// Shows pending/approved/issued livestock requests based on user role

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useLivestockRequests,
  Modal, StatusBadge, StatCard, EquipImage,
  SectionTitle, DataTable, TD, Empty,
  btn, REQUEST_STATUSES,
} from '../Shared';

export default function LivestockRequestPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const { requests, reload } = useLivestockRequests();
  const [selectedRequest, setSelectedRequest] = useState(null);

  const pending = requests.filter(r => r.status === 'Pending');
  const approved = requests.filter(r => r.status === 'Gov_Approved' || r.status === 'Head_Approved');
  const issued = requests.filter(r => r.status === 'Issued');
  const rejected = requests.filter(r => r.status === 'Rejected');

  const canApprove = (request) => {
    if (role === 'Governor Assistant' && request.status === 'Pending') return true;
    if (role === 'Head of the Office' && request.status === 'Gov_Approved') return true;
    return false;
  };

  const handleDecision = async (requestId, decision, remarks = '') => {
    try {
      // TODO: Implement livestock request decision API endpoints
      console.log('Decision:', { requestId, decision, remarks });
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
        <StatCard label="Total Requests" value={requests.length} icon={<i className="bx bx-clipboard" />} accent="#374151" />
        <StatCard label="Pending" value={pending.length} icon={<i className="bx bx-time" />} accent="#d97706" />
        <StatCard label="Approved" value={approved.length} icon={<i className="bx bx-send" />} accent="#2563eb" />
        <StatCard label="Issued" value={issued.length} icon={<i className="bx bx-check-circle" />} accent="#16a34a" />
      </div>

      <SectionTitle
        title={role === 'Farmer Association Representative' ? 'My Livestock Requests' : 'Livestock Requests'}
        sub={role === 'Farmer Association Representative'
          ? 'Track the status of your livestock request for breeding and herd development'
          : 'Review and process livestock dispersal requests'
        }
        action={role === 'Farmer Association Representative' ? (
          <button style={btn.primary} onClick={() => navigate('../livestock')}>
            + New Request
          </button>
        ) : null}
      />

      <DataTable
        columns={['Livestock', 'Type', 'Qty', 'Requester', 'Association', 'Status', 'Date', 'Actions']}
        emptyIcon={<i className="bx bx-paw" />}
        emptyMsg={role === 'Farmer Association Representative'
          ? 'You have not submitted any livestock requests yet.'
          : 'No livestock requests found.'
        }
        rows={requests.map(r => (
          <>
            <TD bold>{r.livestock_id?.name || '—'}</TD>
            <TD muted>{r.livestock_id?.type || '—'}</TD>
            <TD>{r.quantity_requested}</TD>
            <TD muted>{r.farmer_id?.fullName || '—'}</TD>
            <TD muted>{r.association_id?.name || '—'}</TD>
            <TD><StatusBadge status={r.status} /></TD>
            <TD muted>{new Date(r.createdAt).toLocaleDateString()}</TD>
            <td style={{ padding: '8px 16px' }}>
              <button
                style={btn.outline}
                onClick={() => setSelectedRequest(r)}
              >
                View
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
          title="Livestock Request Details"
          onClose={() => setSelectedRequest(null)}
          wide
        >
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <EquipImage
              imageId={selectedRequest.livestock_id?.imageId}
              name={selectedRequest.livestock_id?.name}
              size={100}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 4 }}>
                {selectedRequest.livestock_id?.name}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                {selectedRequest.livestock_id?.type}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <StatusBadge status={selectedRequest.status} />
                <span style={{ fontSize: 14, color: '#6b7280' }}>
                  Quantity: {selectedRequest.quantity_requested} heads
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Requester</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selectedRequest.farmer_id?.fullName}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{selectedRequest.farmer_id?.email}</div>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Association</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selectedRequest.association_id?.name || 'N/A'}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Farmer Association</div>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Request Date</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{new Date(selectedRequest.createdAt).toLocaleDateString()}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Submitted</div>
            </div>

            {selectedRequest.issued_date && (
              <div style={{ background: '#dcfce7', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Issued Date</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>{new Date(selectedRequest.issued_date).toLocaleDateString()}</div>
                <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>Dispersed to farmer</div>
              </div>
            )}
          </div>

          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Purpose</div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{selectedRequest.purpose}</div>
          </div>

          {selectedRequest.governor_remarks && (
            <div style={{ background: '#dbeafe', borderRadius: 8, padding: 16, marginBottom: 12, borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>Governor Remarks</div>
              <div style={{ fontSize: 13, color: '#1e40af' }}>{selectedRequest.governor_remarks}</div>
            </div>
          )}

          {selectedRequest.head_remarks && (
            <div style={{ background: '#ede9fe', borderRadius: 8, padding: 16, borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5b21b6', marginBottom: 6 }}>Head of Office Remarks</div>
              <div style={{ fontSize: 13, color: '#5b21b6' }}>{selectedRequest.head_remarks}</div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
