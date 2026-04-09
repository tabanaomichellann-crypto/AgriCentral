import { useNavigate } from 'react-router-dom';

function ExtensionWorkerDashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem('fullName');
  const logout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f2', padding: '2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#1b4332', fontSize: '1.6rem' }}>Agriculture Extension Worker Dashboard</h1>
            <p style={{ color: '#6b7280' }}>Welcome, {name}</p>
          </div>
          <button onClick={logout} style={{ padding: '8px 18px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Logout</button>
        </div>
        <div style={{ background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <p style={{ color: '#6b7280' }}>Agriculture Extension Worker content goes here.</p>
        </div>
      </div>
    </div>
  );
}

export default ExtensionWorkerDashboard;