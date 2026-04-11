import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUsers, createUser, updateUserStatus, deleteUser } from '../services/api';
import '../styles/AdminDashboard.css';
import logo from '../assets/AgriCentral_Logo.png';

const ROLES = [
  'Program Coordinator',
  'Agriculture Extension Worker',
  'Head of the Office',
  'Farmer Association Representative',
  'Governor Assistant'
];

const ROLE_PILL = {
  'Program Coordinator': 'pill-coord',
  'Agriculture Extension Worker': 'pill-ext',
  'Head of the Office': 'pill-head',
  'Farmer Association Representative': 'pill-rep',
  'Governor Assistant': 'pill-gov',
};

const NAV = [{ icon: '👥', label: 'User Management' }];

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', username: '', password: '', role: '' });
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const fullName = localStorage.getItem('fullName');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
      setError('');
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Failed to load users.');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    if (role !== 'Admin' || !token) return navigate('/login');

    try {
      const { exp } = jwtDecode(token);
      if (Date.now() >= exp * 1000) {
        localStorage.clear();
        return navigate('/login');
      }
    } catch {
      localStorage.clear();
      return navigate('/login');
    }

    fetchUsers();
  }, [navigate, fetchUsers]);

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError('');
    setForm({ fullName: '', username: '', password: '', role: '' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalError('');
    setLoading(true);

    try {
      await createUser(form);
      closeModal();
      fetchUsers();
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        localStorage.clear();
        navigate('/login');
      } else {
        setModalError(err.response?.data?.message || 'Failed to create user.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, status) => {
    try {
      await updateUserStatus(id, status === 'Active' ? 'Inactive' : 'Active');
      fetchUsers();
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Failed to update status.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Failed to delete user.');
      }
    }
  };

  const nonAdmin = users.filter(u => u.role !== 'Admin');

  const filtered = nonAdmin.filter(u => {
    if (filterRole && u.role !== filterRole) return false;
    if (
      search &&
      !u.fullName.toLowerCase().includes(search.toLowerCase()) &&
      !u.username.toLowerCase().includes(search.toLowerCase())
    ) return false;
    return true;
  });

  return (
    <div className="layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="AgriCentral Logo" className="sidebar-logo" />
          AgriCentral
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button key={item.label} className="nav-btn active">
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-name">{fullName}</div>
            <div className="user-role">Admin</div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <span>🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <div className="topbar">
          <span className="topbar-title">User Management</span>
        </div>

        <div className="body">

          <div className="page-header">
            <h2>All Users</h2>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              + Create User
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-card-head">
                <div className="stat-label">Total Users</div>
                <span className="stat-icon"><i className="bx bx-user"></i></span>
              </div>
              <div className="stat-value">{nonAdmin.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-head">
                <div className="stat-label">Active</div>
                <span className="stat-icon stat-icon-active"><i className="bx bx-check-circle"></i></span>
              </div>
              <div className="stat-value">{nonAdmin.filter(u => u.status === 'Active').length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-head">
                <div className="stat-label">Inactive</div>
                <span className="stat-icon stat-icon-inactive"><i className="bx bx-x-circle"></i></span>
              </div>
              <div className="stat-value">{nonAdmin.filter(u => u.status === 'Inactive').length}</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
            >
              <option value="">All roles</option>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="td-empty">No users found.</td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u._id}>
                    <td className="td-bold">{u.fullName}</td>
                    <td className="td-muted">{u.username}</td>
                    <td>
                      <span className={`pill ${ROLE_PILL[u.role] || ''}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`pill ${u.status === 'Active' ? 'pill-active' : 'pill-inactive'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-action" onClick={() => handleToggle(u._id, u.status)}>
                        {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-action danger" onClick={() => handleDelete(u._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New User</h3>

            {modalError && <div className="modal-error">{modalError}</div>}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  required
                >
                  <option value="">Select role</option>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}