// pages/CoordinatorDashboard.jsx
// Added: Equipment tab with full CRUD (name, category, image → MongoDB),
//        all request monitoring, and AEW condition log validation.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getFarmers, createFarmer, deleteFarmer,
  getAssociations, createAssociation, deleteAssociation,
  getMembers, addMember, removeMember,
  getCrops,
} from '../services/api';
import CropPage from './crop/CropPage';
import logo from '../assets/AgriCentral_Logo.png';
import cowIcon from '../assets/cow-icon.svg';
import {
  createEquipment, updateEquipment, deleteEquipment,
  validateConditionLog,
} from '../services/equipmentApi';
import {
  createLivestock, updateLivestock, deleteLivestock,
  createLivestockRequest,
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

function buildStyledReport({ title, subtitle, accent, softAccent, sections }) {
  const safeAccent = accent || '#2b6f57';
  const safeSoftAccent = softAccent || '#e6f4eb';
  const createdAt = new Date().toLocaleString();
  const sectionHtml = sections.map((section) => {
    const rows = section.rows.length
      ? section.rows.map((cells) => `<tr>${cells.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${section.headers.length}" class="empty">No records found.</td></tr>`;

    return `
      <section class="report-section">
        <div class="section-head">
          <h2>${section.title}</h2>
          <span>${section.rows.length} rows</span>
        </div>
        <table>
          <thead>
            <tr>${section.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
    `;
  }).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #17212b;
      background: #f5f8fb;
      font-family: 'Poppins', 'Segoe UI', Tahoma, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
      padding: 28px 24px 34px;
    }
    .hero {
      border: 1px solid #dce8e4;
      border-radius: 18px;
      padding: 18px 20px;
      margin-bottom: 18px;
      background: linear-gradient(130deg, ${safeSoftAccent} 0%, #ffffff 60%);
      box-shadow: 0 12px 28px rgba(35, 62, 78, 0.08);
    }
    .hero h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.2;
      color: ${safeAccent};
    }
    .hero p {
      margin: 10px 0 0;
      color: #526170;
      font-size: 13px;
    }
    .strip {
      margin-top: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #304355;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #d8e5ef;
      border-left: 4px solid ${safeAccent};
      border-radius: 999px;
      padding: 7px 13px;
      font-weight: 500;
    }
    .report-section {
      margin: 0 0 16px;
      background: #ffffff;
      border: 1px solid #dbe6ef;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 6px 14px rgba(30, 58, 83, 0.06);
      page-break-inside: avoid;
    }
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 11px 14px;
      border-bottom: 1px solid #e3edf5;
      background: #f9fcff;
    }
    .section-head h2 {
      margin: 0;
      font-size: 14px;
      letter-spacing: 0.02em;
      color: #1d3347;
      text-transform: uppercase;
    }
    .section-head span {
      font-size: 11px;
      color: #577189;
      font-weight: 600;
      background: #eaf2f9;
      border-radius: 999px;
      padding: 4px 9px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    thead th {
      background: #f4f8fc;
      color: #48637a;
      text-align: left;
      padding: 9px 10px;
      border-bottom: 1px solid #e2ebf2;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #edf2f7;
      color: #243544;
      vertical-align: top;
    }
    tbody tr:nth-child(odd) td {
      background: #fbfdff;
    }
    tbody tr:last-child td {
      border-bottom: 0;
    }
    .empty {
      text-align: center;
      color: #6a7f92;
      padding: 16px;
    }
    @media print {
      body { background: #ffffff; }
      .container { max-width: none; padding: 0; }
      .hero { box-shadow: none; border-color: #cfd8df; }
      .report-section { box-shadow: none; border-color: #d7e0e7; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="hero">
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <div class="strip">Generated on ${createdAt}</div>
    </header>
    ${sectionHtml}
  </div>
</body>
</html>`;
}

function buildReportHtml({ farmers, assocs, crops, equipment, requests, logs, livestock, livestockRequests }) {
  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '';
  return buildStyledReport({
    title: 'AgriCentral Coordinator Masterlist',
    subtitle: 'Consolidated records across farmers, associations, crops, equipment, livestock, requests, and condition logs.',
    accent: '#1f6f5f',
    softAccent: '#e6f5ef',
    sections: [
      {
        title: 'Farmers',
        headers: ['RSBA Number', 'Name', 'Contact', 'Address', 'Proof', 'Registered At'],
        rows: farmers.map(f => [f.rsbaNumber, `${f.firstName} ${f.lastName}`, f.contactNumber || '', f.address || '', f.proofOfOwnershipType || '', formatDate(f.registeredAt)]),
      },
      {
        title: 'Associations',
        headers: ['Name', 'Address', 'President', 'Members', 'Registered At'],
        rows: assocs.map(a => [a.associationName, a.address || '', a.presidentName || a.presidentUserId?.fullName || '', a.memberCount ?? 0, formatDate(a.registeredAt)]),
      },
      {
        title: 'Crops',
        headers: ['Crop', 'Category', 'Area Planted', 'Yield Estimate', 'Status'],
        rows: crops.map(crop => [crop.crop_name || crop.name || '', crop.category || '', crop.area_planted || '', crop.yield_estimate || '', crop.status || '']),
      },
      {
        title: 'Equipment Inventory',
        headers: ['Equipment', 'Category', 'Total', 'Available', 'Status'],
        rows: equipment.map(item => [item.equipment_name, item.category || '', item.quantity_total, item.quantity_available, item.status]),
      },
      {
        title: 'Equipment Requests',
        headers: ['Association', 'Equipment', 'Qty', 'Purpose', 'Status', 'Requested At'],
        rows: requests.map(r => [r.association_id?.associationName || '', r.equipment_id?.equipment_name || '', r.quantity_requested, r.purpose || '', r.status, formatDate(r.requested_at)]),
      },
      {
        title: 'Condition Logs',
        headers: ['Equipment', 'Recorded By', 'Condition', 'Remarks', 'Proof Image ID', 'Recorded At', 'Validated'],
        rows: logs.map(l => [l.equipment_id?.equipment_name || '', l.recorded_by?.fullName || '', l.condition_status || '', l.remarks || '', l.proofImageId || '', formatDate(l.recorded_at), l.validated ? 'Yes' : 'No']),
      },
      {
        title: 'Livestock Inventory',
        headers: ['Breed', 'Type', 'Total', 'Available', 'Status', 'Notes'],
        rows: livestock.map(item => [item.name, item.type || '', item.quantity_total, item.quantity_available, item.status, item.notes || '']),
      },
      {
        title: 'Livestock Requests',
        headers: ['Livestock', 'Type', 'Qty', 'Requester', 'Association', 'Status', 'Requested At', 'Purpose'],
        rows: livestockRequests.map(r => [r.livestock_id?.name || '', r.livestock_id?.type || '', r.quantity_requested, r.farmer_id?.fullName || '', r.association_id?.associationName || '', r.status, formatDate(r.createdAt), r.purpose || '']),
      },
    ],
  });
}

function openReportWindow(html) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => { win.print(); };
}

function buildFarmersReport(farmers) {
  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '';
  return buildStyledReport({
    title: 'AgriCentral Farmers Report',
    subtitle: 'Registered farmers and ownership profile details.',
    accent: '#0f766e',
    softAccent: '#dcf7f5',
    sections: [
      {
        title: 'Farmers',
        headers: ['RSBA Number', 'Name', 'Contact', 'Address', 'Proof', 'Registered At'],
        rows: farmers.map(f => [f.rsbaNumber, `${f.firstName} ${f.lastName}`, f.contactNumber || '', f.address || '', f.proofOfOwnershipType || '', formatDate(f.registeredAt)]),
      },
    ],
  });
}

function buildAssociationsReport(assocs) {
  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '';
  return buildStyledReport({
    title: 'AgriCentral Associations Report',
    subtitle: 'Farmer association records, leaders, and membership counts.',
    accent: '#155e75',
    softAccent: '#e0f2fe',
    sections: [
      {
        title: 'Associations',
        headers: ['Name', 'Address', 'President', 'Members', 'Registered At'],
        rows: assocs.map(a => [a.associationName, a.address || '', a.presidentName || a.presidentUserId?.fullName || '', a.memberCount ?? 0, formatDate(a.registeredAt)]),
      },
    ],
  });
}

function buildEquipmentReport(equipment, requests, logs) {
  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '';
  return buildStyledReport({
    title: 'AgriCentral Equipment Report',
    subtitle: 'Equipment inventory status, request pipeline, and field condition logs.',
    accent: '#1d4ed8',
    softAccent: '#dbeafe',
    sections: [
      {
        title: 'Equipment Inventory',
        headers: ['Equipment', 'Category', 'Total', 'Available', 'Status'],
        rows: equipment.map(item => [item.equipment_name, item.category || '', item.quantity_total, item.quantity_available, item.status]),
      },
      {
        title: 'Equipment Requests',
        headers: ['Association', 'Equipment', 'Qty', 'Purpose', 'Status', 'Requested At'],
        rows: requests.map(r => [r.association_id?.associationName || '', r.equipment_id?.equipment_name || '', r.quantity_requested, r.purpose || '', r.status, formatDate(r.requested_at)]),
      },
      {
        title: 'Condition Logs',
        headers: ['Equipment', 'Recorded By', 'Condition', 'Remarks', 'Proof Image ID', 'Recorded At', 'Validated'],
        rows: logs.map(l => [l.equipment_id?.equipment_name || '', l.recorded_by?.fullName || '', l.condition_status || '', l.remarks || '', l.proofImageId || '', formatDate(l.recorded_at), l.validated ? 'Yes' : 'No']),
      },
    ],
  });
}

function buildLivestockReport(livestock, livestockRequests) {
  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '';
  return buildStyledReport({
    title: 'AgriCentral Livestock Report',
    subtitle: 'Livestock inventory and distribution requests across associations.',
    accent: '#b45309',
    softAccent: '#fff0d8',
    sections: [
      {
        title: 'Livestock Inventory',
        headers: ['Breed', 'Type', 'Total', 'Available', 'Status', 'Notes'],
        rows: livestock.map(item => [item.name, item.type || '', item.quantity_total, item.quantity_available, item.status, item.notes || '']),
      },
      {
        title: 'Livestock Requests',
        headers: ['Livestock', 'Type', 'Qty', 'Requester', 'Association', 'Status', 'Requested At', 'Purpose'],
        rows: livestockRequests.map(r => [r.livestock_id?.name || '', r.livestock_id?.type || '', r.quantity_requested, r.farmer_id?.fullName || '', r.association_id?.associationName || '', r.status, formatDate(r.createdAt), r.purpose || '']),
      },
    ],
  });
}

function buildCropsReport(crops) {
  return buildStyledReport({
    title: 'AgriCentral Crops Report',
    subtitle: 'Crop categories, planted area, estimated yield, and status monitoring.',
    accent: '#15803d',
    softAccent: '#e5f8e9',
    sections: [
      {
        title: 'Crops',
        headers: ['Crop', 'Category', 'Area Planted', 'Yield Estimate', 'Status'],
        rows: crops.map(crop => [crop.crop_name || crop.name || '', crop.category || '', crop.area_planted || '', crop.yield_estimate || '', crop.status || '']),
      },
    ],
  });
}

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const name     = localStorage.getItem('fullName');
  const logout   = () => { localStorage.clear(); navigate('/login'); };
  const [tab, setTab] = useState('Farmers');

  // ── Farmers state ──────────────────────────────────────────────────────
  const [farmers, setFarmers]       = useState([]);
  const [assocs, setAssocs]         = useState([]);
  const [crops, setCrops]           = useState([]);
  const [showFarmer, setShowFarmer] = useState(false);
  const [showAssoc, setShowAssoc]   = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
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
  const { requests: livestockRequests, reload: reloadLivestockRequests } = useLivestockRequests();
  const [showLivestockModal, setShowLivestockModal] = useState(false);
  const [editLivestock, setEditLivestock]      = useState(null);
  const [livestockForm, setLivestockForm]      = useState({ name: '', type: '', quantity_total: 0, quantity_available: 0, status: 'Ready_For_Dispersal', image: null, notes: '' });
  const [showLivestockRequestModal, setShowLivestockRequestModal] = useState(false);
  const [livestockRequestForm, setLivestockRequestForm] = useState({ livestockId: '', farmerId: '', associationId: '', quantity_requested: 1, purpose: '' });
  const [requestError, setRequestError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  // ── Shared ─────────────────────────────────────────────────────────────
  const [error, setError]           = useState('');
  const [modalError, setModalError] = useState('');
  const [loading, setLoading]       = useState(false);
  const [livestockTab, setLivestockTab] = useState('Inventory');

  const loadAll = useCallback(async () => {
    try {
      const [f, a, c] = await Promise.all([getFarmers(), getAssociations(), getCrops()]);
      setFarmers(f.data);
      setAssocs(a.data);
      setCrops(c.data);
    } catch {
      setError('Failed to load data.');
    }
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

  const handleDeleteAssoc = async (id) => {
    if (!window.confirm('Delete this association?')) return;
    try {
      await deleteAssociation(id);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete association.');
    }
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
      const formData = new FormData();
      formData.append('equipment_name', equipForm.equipment_name);
      formData.append('category', equipForm.category);
      formData.append('quantity_total', equipForm.quantity_total);
      formData.append('quantity_available', equipForm.quantity_available);
      formData.append('status', equipForm.status);
      if (equipForm.image) formData.append('image', equipForm.image);

      if (editItem) await updateEquipment(editItem._id, formData);
      else          await createEquipment(formData);

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
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setModalError('Livestock service is not available on the active backend. Redeploy the server with livestock routes enabled.');
      } else if (status === 503) {
        setModalError(err.response?.data?.message || 'Database is not connected. Please try again later.');
      } else {
        setModalError(err.response?.data?.message || 'Failed to save livestock.');
      }
    }
    finally { setLoading(false); }
  };

  const handleDeleteLivestock = async (id) => {
    if (!window.confirm('Delete this livestock?')) return;
    try { await deleteLivestock(id); reloadLivestock(); }
    catch { setError('Failed to delete livestock.'); }
  };

  // ── Nav ────────────────────────────────────────────────────────────────
  const navItems = [
  { key: 'Farmers',      icon: <i className="bx bx-user" />, label: 'Farmers' },
  { key: 'Associations', icon: <i className="bx bx-group" />, label: 'Associations' },
  { key: 'Equipment',    icon: <i className="bx bx-briefcase" />, label: 'Equipment' },
  { key: 'Livestock',    icon: <img src={cowIcon} alt="Livestock" style={{ width: 18, height: 18 }} />, label: 'Livestock' }, 
  { key: 'Crops',        icon: <i className="bx bxs-leaf" />, label: 'Crops' },
];

  const ef = k => e => setEquipForm(p => ({ ...p, [k]: e.target.value }));
  const lf = k => e => setLivestockForm(p => ({ ...p, [k]: e.target.value }));
  const ff = k => e => setFarmerForm(p => ({ ...p, [k]: e.target.value }));
  const af = k => e => setAssocForm(p => ({ ...p, [k]: e.target.value }));
  const rf = k => e => setLivestockRequestForm(p => ({ ...p, [k]: e.target.value }));

  const handleDownloadReport = async (e) => {
    e.preventDefault();
    const html = buildReportHtml({ farmers, assocs, crops, equipment, requests, logs, livestock, livestockRequests });
    openReportWindow(html);
    setShowReportModal(false);
  };

  const handleFarmersReport = () => {
    const html = buildFarmersReport(farmers);
    openReportWindow(html);
  };

  const handleAssociationsReport = () => {
    const html = buildAssociationsReport(assocs);
    openReportWindow(html);
  };

  const handleEquipmentReport = () => {
    const html = buildEquipmentReport(equipment, requests, logs);
    openReportWindow(html);
  };

  const handleLivestockReport = () => {
    const html = buildLivestockReport(livestock, livestockRequests);
    openReportWindow(html);
  };

  const handleCropsReport = () => {
    const html = buildCropsReport(crops);
    openReportWindow(html);
  };

  const openLivestockRequest = () => {
    setLivestockRequestForm({
      livestockId: livestock[0]?._id || '',
      farmerId: farmers[0]?._id || '',
      associationId: assocs[0]?._id || '',
      quantity_requested: 1,
      purpose: '',
    });
    setRequestError('');
    setShowLivestockRequestModal(true);
  };

  const handleCreateLivestockRequest = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestError('');

    try {
      await createLivestockRequest({
        livestock_id: livestockRequestForm.livestockId,
        farmer_id: livestockRequestForm.farmerId,
        association_id: livestockRequestForm.associationId || undefined,
        quantity_requested: Number(livestockRequestForm.quantity_requested),
        purpose: livestockRequestForm.purpose,
      });
      setShowLivestockRequestModal(false);
      reloadLivestockRequests();
    } catch (err) {
      setRequestError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setRequestLoading(false);
    }
  };

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
          <div className="coord-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="coord-light-green-btn" onClick={() => setShowReportModal(true)}>
              Generate Report
            </button>
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
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="report-tab-btn" onClick={handleFarmersReport}>Generate Farmers Report</button>
                  <button className="coord-light-green-btn" onClick={() => { setModalError(''); setShowFarmer(true); }}>+ Add Farmer</button>
                </div>
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
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="report-tab-btn" onClick={handleAssociationsReport}>Generate Associations Report</button>
                  <button className="coord-light-green-btn" onClick={() => { setModalError(''); setShowAssoc(true); }}>+ Add Association</button>
                </div>
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
                            <button className="btn-danger-sm" onClick={() => handleDeleteAssoc(a._id)}>Delete</button>
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
                action={<div style={{ display: 'flex', gap: 10 }}><button className="report-equipment-btn" onClick={handleEquipmentReport}>Generate Equipment Report</button><button style={btn.primary} onClick={openAddEquip}>+ Add Equipment</button></div>}
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
                <h2><i className="bx bx-cow" style={{ marginRight: 10 }}></i> Livestock Management</h2>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="report-tab-btn" onClick={handleLivestockReport}>Generate Livestock Report</button>
                  <p>Monitor herd inventory and review livestock distribution requests.</p>
                </div>
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
                    <StatCard label="Total Breeds" value={livestock.length} icon={<img src={cowIcon} alt="Breeds" style={{ width: 28, height: 28 }} />} accent="#16a34a" />
                    <StatCard label="Available Heads" value={livestock.reduce((s, l) => s + l.quantity_available, 0)} icon={<i className="bx bx-check-circle" style={{ fontSize: 26 }} />} accent="#2563eb" />
                    <StatCard label="Total Heads" value={livestock.reduce((s, l) => s + l.quantity_total, 0)} icon={<i className="bx bx-bar-chart-alt-2" style={{ fontSize: 26 }} />} accent="#7c3aed" />
                    <StatCard label="Pending Requests" value={livestockRequests.filter(r => r.status === 'Pending').length} icon={<i className="bx bx-time-five" style={{ fontSize: 26 }} />} accent="#d97706" />
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
                  <SectionTitle
                    title="Livestock Distribution Requests"
                    sub="All livestock dispersal requests"
                    action={
                      <button style={btn.primary} onClick={openLivestockRequest}>
                        + Request Livestock
                      </button>
                    }
                  />
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
            <>
              <div className="coord-page-header">
                <h2>Crop Management</h2>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="report-tab-btn" onClick={handleCropsReport}>Generate Crops Report</button>
                </div>
              </div>
              <CropPage />
            </>
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
              ? <Empty icon={<i className="bx bx-group" />} message="No members yet." />
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

      {showLivestockRequestModal && (
        <Modal title="Request Livestock" onClose={() => setShowLivestockRequestModal(false)}
          onSubmit={handleCreateLivestockRequest} loading={requestLoading} submitLabel="Submit Request">
          {requestError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{requestError}</div>}
          <Field label="Select Livestock">
            <select style={inputStyle} value={livestockRequestForm.livestockId} onChange={rf('livestockId')} required>
              <option value="">Choose livestock…</option>
              {livestock.filter(item => item.quantity_available > 0).map(item => (
                <option key={item._id} value={item._id}>{item.name} ({item.type}) — {item.quantity_available} available</option>
              ))}
            </select>
          </Field>
          <Field label="Select Farmer">
            <select style={inputStyle} value={livestockRequestForm.farmerId} onChange={rf('farmerId')} required>
              <option value="">Choose farmer…</option>
              {farmers.map(f => (
                <option key={f._id} value={f._id}>{f.firstName} {f.lastName} — {f.rsbaNumber}</option>
              ))}
            </select>
          </Field>
          <Field label="Association">
            <select style={inputStyle} value={livestockRequestForm.associationId} onChange={rf('associationId')}>
              <option value="">Select association (optional)</option>
              {assocs.map(a => (
                <option key={a._id} value={a._id}>{a.associationName}</option>
              ))}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Requested Quantity">
              <input style={inputStyle} type="number" min={1} value={livestockRequestForm.quantity_requested} onChange={rf('quantity_requested')} required />
            </Field>
            <Field label="Purpose">
              <input style={inputStyle} value={livestockRequestForm.purpose} onChange={rf('purpose')} required placeholder="Why do you need this livestock?" />
            </Field>
          </div>
        </Modal>
      )}

      {showReportModal && (
        <Modal title="Generate Report" onClose={() => setShowReportModal(false)} onSubmit={handleDownloadReport} wide>
          <div className="report-modal-copy">
            Export a clean coordinator report as PDF. This includes farmers, associations, crops, equipment inventory, requests, condition logs, and livestock details.
          </div>
          <div className="report-modal-list">
            <div className="report-modal-tip">
              <span className="report-modal-tip-icon"><i className="bx bx-printer" /></span>
              <span>After clicking Download, your browser will open the print dialog. Choose "Save as PDF" to create the file.</span>
            </div>
            <div className="report-modal-tip">
              <span className="report-modal-tip-icon"><i className="bx bx-palette" /></span>
              <span>Each report now uses themed colors and cleaner tables for easier presentation and printing.</span>
            </div>
          </div>
          <div className="report-modal-actions">
            <button type="button" style={btn.ghost} onClick={() => setShowReportModal(false)}>Cancel</button>
            <button type="submit" className="report-download-btn">Download PDF</button>
          </div>
        </Modal>
      )}
    </div>
  );
}