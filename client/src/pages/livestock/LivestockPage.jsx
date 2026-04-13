import { useState } from 'react';
import {
  useLivestock, Modal, StatusBadge, StatCard, EquipImage,
  SectionTitle, DataTable, TD, btn,
} from '../Shared';

export default function LivestockPage() {
  const { livestock } = useLivestock();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [detailItem, setDetailItem] = useState(null);

  const available = livestock.filter(item => item.status === 'Ready_For_Dispersal' && item.quantity_available > 0);
  const categories = [...new Set(livestock.map(item => item.type).filter(Boolean))];
  const filtered = available.filter(item => !categoryFilter || item.type === categoryFilter);

  return (
    <div className="coord-body">
      <div className="coord-page-header" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="bx bx-paw" style={{ fontSize: 24, color: '#16a34a' }}></i>
          <h2 style={{ margin: 0 }}>Livestock Inventory</h2>
        </div>
        <p>Browse livestock stocks, monitor availability, and review herd details.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Breeds" value={livestock.length} icon={<i className="bx bx-paw" />} accent="#16a34a" />
        <StatCard label="Available Heads" value={available.reduce((sum, item) => sum + item.quantity_available, 0)} icon={<i className="bx bx-check-circle" />} accent="#2563eb" />
        <StatCard label="Types" value={categories.length} icon={<i className="bx bx-folder" />} accent="#7c3aed" />
        <StatCard label="Non-Available" value={livestock.filter(item => item.status !== 'Ready_For_Dispersal').length} icon={<i className="bx bx-alert-triangle" />} accent="#f59e0b" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            style={{ ...btn.ghost, ...(categoryFilter === '' ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
            onClick={() => setCategoryFilter('')}
          >
            All Breeds
          </button>
          {categories.map(type => (
            <button
              key={type}
              style={{ ...btn.ghost, ...(categoryFilter === type ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
              onClick={() => setCategoryFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <button style={{ ...btn.primary, opacity: 0.75, cursor: 'not-allowed' }} disabled>
          + Add Livestock
        </button>
      </div>

      <SectionTitle
        title="Livestock Inventory"
        sub="All animal stocks stored in MongoDB"
      />

      <DataTable
        columns={['Photo', 'Breed', 'Type', 'Total', 'Available', 'Status', 'Action']}
        emptyIcon={<i className="bx bx-paw" />}
        emptyMsg="No livestock inventory available."
        rows={filtered.map(item => (
          <>
            <td style={{ padding: '10px 16px' }}><EquipImage imageId={item.imageId} name={item.name} size={40} /></td>
            <TD bold>{item.name}</TD>
            <TD muted>{item.type || '—'}</TD>
            <TD>{item.quantity_total}</TD>
            <TD>{item.quantity_available}</TD>
            <TD><StatusBadge status={item.status} /></TD>
            <td style={{ padding: '10px 16px' }}>
              <button style={btn.outline} onClick={() => setDetailItem(item)}>Details</button>
            </td>
          </>
        ))}
      />

      {detailItem && (
        <Modal title="Livestock Details" onClose={() => setDetailItem(null)}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            <EquipImage imageId={detailItem.imageId} name={detailItem.name} size={120} />
            <div style={{ minWidth: 220, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 4 }}>{detailItem.name}</div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>{detailItem.type}</div>
              <StatusBadge status={detailItem.status} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 20 }}>
            {[
              ['Total Heads', detailItem.quantity_total],
              ['Available', detailItem.quantity_available],
              ['In Use', detailItem.quantity_total - detailItem.quantity_available],
              ['Status', detailItem.status.replace(/_/g, ' ')]
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Notes</div>
            <div style={{ fontSize: 14, color: '#374151' }}>{detailItem.notes || 'No notes available for this herd.'}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
