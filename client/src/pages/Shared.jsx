// pages/equipment/shared.jsx
// Shared components, hooks, and constants used by ALL dashboard equipment sections.

import { useState, useEffect, useCallback } from 'react';
import {
  getEquipment, getEquipmentRequests, getMyEquipmentRequests,
  getConditionLogs, getImageUrl,
} from '../services/equipmentApi';
import {
  getLivestock, getLivestockRequests, getMyLivestockRequests,
} from '../services/livestockApi';

// Constants
export const CATEGORIES = [
  'Tractor', 'Hand Tractor', 'Thresher', 'Water Pump',
  'Sprayer', 'Transplanter', 'Harvester', 'Rice Mill',
  'Combine Harvester', 'Seed Drill', 'Other',
];

export const EQUIP_STATUSES   = ['Available', 'In_Use', 'Under_Repair', 'Retired'];
export const REQUEST_STATUSES = ['Pending', 'Gov_Approved', 'Head_Approved', 'Issued', 'Rejected'];
export const LIVESTOCK_STATUSES = ['Ready_For_Dispersal', 'Under_Quarantine', 'Breeding', 'Unavailable'];
export const CONDITIONS       = ['Good', 'Fair', 'Poor', 'Damaged'];

// Status badge colors 
const STATUS_COLORS = {
  Available:    { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  In_Use:       { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  Under_Repair: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  Retired:      { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  Pending:      { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  Gov_Approved: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  Head_Approved:{ bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  Issued:       { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  Rejected:     { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  Good:         { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Fair:         { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  Poor:         { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  Damaged:      { bg: '#ffe4e6', text: '#9f1239', border: '#fda4af' },
  Ready_For_Dispersal: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  Under_Quarantine:    { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  Breeding:            { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  Unavailable:         { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

export function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// Equipment image display 
export function EquipImage({ imageId, name, size = 48 }) {
  const url = getImageUrl(imageId);
  return url ? (
    <img src={url} alt={name}
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: 8, background: '#f0fdf4',
      border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.45, flexShrink: 0,
    }}>🚜</div>
  );
}

// ── Image file picker with preview ────────────────────────────────────────
export function ImagePicker({ value, onChange, label = 'Photo' }) {
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onChange(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {preview && (
          <img src={preview} alt="preview"
            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        )}
        <label style={{
          cursor: 'pointer', padding: '7px 14px', background: '#f0fdf4',
          border: '1px dashed #86efac', borderRadius: 8, fontSize: 13, color: '#166534',
        }}>
          {preview ? '📷 Change photo' : '📷 Upload photo'}
          <input type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
        </label>
        {preview && (
          <button type="button" onClick={() => { setPreview(null); onChange(null); }}
            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// Form helpers 
export const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
export const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 13, color: '#111827', boxSizing: 'border-box',
  background: '#fff', outline: 'none',
};

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// Buttons 
export const btn = {
  primary:  { background: '#16a34a', color: '#fff',     border: 'none',               padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  outline:  { background: '#fff',    color: '#16a34a',  border: '1px solid #16a34a',  padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  danger:   { background: '#fff',    color: '#dc2626',  border: '1px solid #dc2626',  padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  ghost:    { background: 'none',    color: '#6b7280',  border: '1px solid #e5e7eb',  padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
  approve:  { background: '#16a34a', color: '#fff',     border: 'none',               padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  reject:   { background: '#dc2626', color: '#fff',     border: 'none',               padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
};

// Modal 
export function Modal({ title, onClose, onSubmit, loading, submitLabel = 'Save', wide, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 32px',
        width: wide ? 640 : 500, maxWidth: '95vw', maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px', fontSize: 17, color: '#111827', fontWeight: 700 }}>{title}</h3>
        {onSubmit ? (
          <form onSubmit={onSubmit}>
            {children}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
              <button type="button" style={btn.ghost} onClick={onClose}>Cancel</button>
              <button type="submit" style={btn.primary} disabled={loading}>
                {loading ? 'Saving…' : submitLabel}
              </button>
            </div>
          </form>
        ) : (
          <>
            {children}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
              <button style={btn.ghost} onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Stat card 
export function StatCard({ label, value, icon, accent = '#16a34a' }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
      borderLeft: `4px solid ${accent}`,
    }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>{value}</div>
      </div>
    </div>
  );
}

// Section title 
export function SectionTitle({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '28px 0 14px' }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// Empty state 
export function Empty({ icon = '📋', message = 'No data found.' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}

// Data table 
export function DataTable({ columns, rows, emptyIcon, emptyMsg }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      {rows.length === 0 ? (
        <Empty icon={emptyIcon} message={emptyMsg} />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {columns.map(c => (
                <th key={c} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                {row}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export const TD = ({ children, muted, bold }) => (
  <td style={{ padding: '12px 16px', color: muted ? '#6b7280' : '#111827', fontWeight: bold ? 600 : 400, verticalAlign: 'middle' }}>
    {children}
  </td>
);

// Process flow banner 
const FLOW_STEPS = [
  { role: 'Assoc. Rep',    action: 'Submits request',          color: '#16a34a' },
  { role: 'Governor',      action: '1st approval',             color: '#2563eb' },
  { role: 'Head of Office',action: '2nd approval + issuance',  color: '#7c3aed' },
  { role: 'AEW',           action: 'Field inspection',         color: '#d97706' },
  { role: 'Coordinator',   action: 'Validates condition log',  color: '#059669' },
];

export function ProcessFlowBanner({ activeRole }) {
  return (
    <div style={{
      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
      padding: '14px 20px', marginBottom: 24, overflowX: 'auto',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Equipment Utilization Process
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {FLOW_STEPS.map((step, i) => {
          const isActive = activeRole && step.role.toLowerCase().includes(activeRole.toLowerCase());
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                textAlign: 'center', padding: '6px 12px', borderRadius: 8,
                background: isActive ? step.color : 'transparent',
                transition: 'background 0.2s',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#fff' : '#374151' }}>{step.role}</div>
                <div style={{ fontSize: 10, color: isActive ? 'rgba(255,255,255,0.8)' : '#9ca3af' }}>{step.action}</div>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div style={{ color: '#86efac', fontSize: 18, padding: '0 4px', flexShrink: 0 }}>›</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Data hooks 
export function useEquipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEquipment();
      setEquipment(res.data);
      setError('');
    } catch { setError('Failed to load equipment.'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { equipment, setEquipment, loading, error, reload: load };
}

export function useRequests(myOnly = false) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = myOnly ? await getMyEquipmentRequests() : await getEquipmentRequests();
      setRequests(res.data);
      setError('');
    } catch { setError('Failed to load requests.'); }
    finally   { setLoading(false); }
  }, [myOnly]);

  useEffect(() => { load(); }, [load]);
  return { requests, setRequests, loading, error, reload: load };
}

export function useLivestock() {
  const [livestock, setLivestock] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLivestock();
      setLivestock(res.data);
      setError('');
    } catch { setError('Failed to load livestock.'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { livestock, setLivestock, loading, error, reload: load };
}

export function useLivestockRequests(myOnly = false) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = myOnly ? await getMyLivestockRequests() : await getLivestockRequests();
      setRequests(res.data);
      setError('');
    } catch { setError('Failed to load livestock requests.'); }
    finally   { setLoading(false); }
  }, [myOnly]);

  useEffect(() => { load(); }, [load]);
  return { requests, setRequests, loading, error, reload: load };
}

export function useConditionLogs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConditionLogs();
      setLogs(res.data);
      setError('');
    } catch { setError('Failed to load condition logs.'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { logs, setLogs, loading, error, reload: load };
}