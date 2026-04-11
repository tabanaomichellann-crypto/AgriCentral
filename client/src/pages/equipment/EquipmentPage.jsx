// EquipmentPage.jsx - Equipment inventory view for coordinators, heads, and farmers
// Shows available equipment and allows requesting (for farmers)

import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  useEquipment,
  Modal, Field, StatusBadge, StatCard, EquipImage,
  SectionTitle, DataTable, TD, Empty,
  btn, inputStyle, CATEGORIES,
} from '../Shared';

export default function EquipmentPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const { equipment } = useEquipment();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [detailItem, setDetailItem] = useState(null);

  const available = equipment.filter(e => e.status === 'Available' && e.quantity_available > 0);
  const categories = [...new Set(equipment.map(e => e.category).filter(Boolean))];
  const filtered = available.filter(e => !categoryFilter || e.category === categoryFilter);

  const openDetail = (item) => setDetailItem(item);

  return (
    <div className="coord-body">
      <div className="coord-page-header">
        <h2>Equipment Inventory</h2>
        <p>Browse and request agricultural equipment</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Equipment" value={equipment.length} icon="🚜" accent="#16a34a" />
        <StatCard label="Available Now" value={available.length} icon="✅" accent="#2563eb" />
        <StatCard label="Categories" value={categories.length} icon="📂" accent="#7c3aed" />
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          style={{ ...btn.ghost, ...(categoryFilter === '' ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
          onClick={() => setCategoryFilter('')}
        >
          All Categories
        </button>
        {categories.map(c => (
          <button
            key={c}
            style={{ ...btn.ghost, ...(categoryFilter === c ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } : {}) }}
            onClick={() => setCategoryFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Equipment grid */}
      {filtered.length === 0 ? (
        <Empty icon="🚜" message="No equipment available in this category." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {filtered.map(item => (
            <div
              key={item._id}
              style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
                overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              onClick={() => openDetail(item)}
            >
              <div style={{ height: 160, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <EquipImage imageId={item.imageId} name={item.equipment_name} size={80} />
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>{item.equipment_name}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{item.category}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600 }}>
                    {item.quantity_available} available
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <button
                  style={btn.primary}
                  onClick={e => { e.stopPropagation(); navigate('../requests'); }}
                  disabled={role === 'Farmer Association Representative' ? false : true}
                >
                  {role === 'Farmer Association Representative' ? 'Request Equipment' : 'View Details'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Equipment detail modal */}
      {detailItem && (
        <Modal title="Equipment Details" onClose={() => setDetailItem(null)}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <EquipImage imageId={detailItem.imageId} name={detailItem.equipment_name} size={120} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 4 }}>{detailItem.equipment_name}</div>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>{detailItem.category}</div>
              <StatusBadge status={detailItem.status} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              ['Total Units', detailItem.quantity_total],
              ['Available', detailItem.quantity_available],
              ['In Use', (detailItem.quantity_total - detailItem.quantity_available) || 0],
              ['Status', detailItem.status.replace(/_/g, ' ')],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{value}</div>
              </div>
            ))}
          </div>

          {role === 'Farmer Association Representative' && detailItem.quantity_available > 0 && (
            <button
              style={{ ...btn.primary, width: '100%' }}
              onClick={() => { setDetailItem(null); navigate('../requests'); }}
            >
              Request This Equipment →
            </button>
          )}
        </Modal>
      )}
    </div>
  );
}