// ConditionLogPage.jsx - Equipment condition logs for AEW and coordinators
// Shows field inspection logs and allows validation

import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  useConditionLogs,
  Modal, Field, StatusBadge, EquipImage,
  SectionTitle, DataTable, TD, Empty,
  btn, inputStyle,
} from '../Shared';

export default function ConditionLogPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const { logs, reload } = useConditionLogs();
  const [selectedLog, setSelectedLog] = useState(null);
  const [showValidateModal, setShowValidateModal] = useState(false);

  const pending = logs.filter(l => !l.validated);
  const validated = logs.filter(l => l.validated);

  const canValidate = role === 'Program Coordinator' || role === 'Agriculture Extension Worker';

  const handleValidate = async (logId) => {
    try {
      const { validateConditionLog } = await import('../../services/equipmentApi');
      await validateConditionLog(logId);
      reload();
      setShowValidateModal(false);
      setSelectedLog(null);
    } catch (err) {
      console.error('Validation failed:', err);
    }
  };

  return (
    <div className="coord-body">
      <div className="coord-page-header">
        <h2>Equipment Condition Logs</h2>
        <p>Field inspection reports and validation</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Logs" value={logs.length} icon={<i className="bx bx-clipboard" />} accent="#374151" />
        <StatCard label="Pending Validation" value={pending.length} icon={<i className="bx bx-time" />} accent="#d97706" />
        <StatCard label="Validated" value={validated.length} icon={<i className="bx bx-check" />} accent="#16a34a" />
      </div>

      <SectionTitle
        title="Condition Inspection Logs"
        sub="Field reports from Agriculture Extension Workers"
        action={role === 'Agriculture Extension Worker' ? (
          <button style={btn.primary} onClick={() => navigate('/extension-worker/equipment/logs/new')}>
            + New Inspection
          </button>
        ) : null}
      />

      <DataTable
        columns={['Equipment', 'Photo', 'Inspector', 'Condition', 'Date', 'Status', 'Actions']}
        emptyIcon={<i className="bx bx-clipboard" />}
        emptyMsg="No condition logs found."
        rows={logs.map(log => (
          <>
            <TD bold>{log.equipment_id?.equipment_name || '—'}</TD>
            <td style={{ padding: '10px 16px' }}>
              <EquipImage imageId={log.equipment_id?.imageId} name="" size={40} />
            </td>
            <TD muted>{log.inspector_id?.fullName || '—'}</TD>
            <TD>
              <StatusBadge status={log.condition_status} />
            </TD>
            <TD muted>{new Date(log.createdAt).toLocaleDateString()}</TD>
            <TD>
              <span style={{
                padding: '4px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                background: log.validated ? '#dcfce7' : '#fef9c3',
                color: log.validated ? '#166534' : '#854d0e'
              }}>
                {log.validated ? 'Validated' : 'Pending'}
              </span>
            </TD>
            <td style={{ padding: '8px 16px' }}>
              <button
                style={btn.outline}
                onClick={() => setSelectedLog(log)}
              >
                View Details
              </button>
              {canValidate && !log.validated && (
                <button
                  style={{ ...btn.approve, marginLeft: 8 }}
                  onClick={() => { setSelectedLog(log); setShowValidateModal(true); }}
                >
                  Validate
                </button>
              )}
            </td>
          </>
        ))}
      />

      {/* Log detail modal */}
      {selectedLog && !showValidateModal && (
        <Modal
          title="Condition Log Details"
          onClose={() => setSelectedLog(null)}
          wide
        >
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <EquipImage
              imageId={selectedLog.equipment_id?.imageId}
              name={selectedLog.equipment_id?.equipment_name}
              size={100}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 4 }}>
                {selectedLog.equipment_id?.equipment_name}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                {selectedLog.equipment_id?.category}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <StatusBadge status={selectedLog.condition_status} />
                <span style={{
                  padding: '4px 8px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: selectedLog.validated ? '#dcfce7' : '#fef9c3',
                  color: selectedLog.validated ? '#166534' : '#854d0e'
                }}>
                  {selectedLog.validated ? 'Validated' : 'Pending Validation'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Inspector</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
                {selectedLog.inspector_id?.fullName}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                {selectedLog.inspector_id?.email}
              </div>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Inspection Date</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
                {new Date(selectedLog.createdAt).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                {new Date(selectedLog.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
              Remarks
            </div>
            <div style={{ fontSize: 14, color: '#374151' }}>
              {selectedLog.remarks || 'No remarks provided'}
            </div>
          </div>

          {/* Proof image */}
          {selectedLog.proof_image && (
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                Proof of Inspection
              </div>
              <img
                src={`/api/images/${selectedLog.proof_image}`}
                alt="Inspection proof"
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}
              />
            </div>
          )}

          {/* Validation button */}
          {canValidate && !selectedLog.validated && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                style={btn.approve}
                onClick={() => setShowValidateModal(true)}
              >
                Validate This Log
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* Validation confirmation modal */}
      {showValidateModal && selectedLog && (
        <Modal
          title="Validate Condition Log"
          onClose={() => { setShowValidateModal(false); setSelectedLog(null); }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
              Confirm Validation
            </div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              This will mark the condition log as validated and update the equipment status.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              style={btn.ghost}
              onClick={() => { setShowValidateModal(false); setSelectedLog(null); }}
            >
              Cancel
            </button>
            <button
              style={btn.approve}
              onClick={() => handleValidate(selectedLog._id)}
            >
              Confirm Validation
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}