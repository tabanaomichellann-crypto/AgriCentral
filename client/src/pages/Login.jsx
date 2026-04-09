import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import '../styles/Auth.css';

import logo from '../assets/AgriCentral_Logo.png';

const ROLE_ROUTES = {
  'Admin': '/admin',
  'Program Coordinator': '/coordinator',
  'Agriculture Extension Worker': '/extension-worker',
  'Head of the Office': '/head',
  'Farmer Association Representative': '/farmer',
  'Governor Assistant': '/governor',
};

function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginUser(form);
      const { token, role, fullName } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('fullName', fullName);
      navigate(ROLE_ROUTES[role] ?? null);
      if (!ROLE_ROUTES[role]) setError('Unknown role. Please contact the administrator.');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      <div className="auth-left">
        <div className="auth-brand">
          <img src={logo} alt="AgriCentral Logo" className="brand-logo" />
          <h1>AgriCentral</h1>
          <p>Track, manage, and grow with smarter agriculture. Every farm, every field, every farmer counts in Marinduque.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Sign in</h2>
          <p className="auth-sub">Enter your credentials to continue</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" name="username" placeholder="Enter your username"
                value={form.username} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="Enter your password"
                value={form.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-hint">Access is provided by the system administrator.</p>
        </div>
      </div>

    </div>
  );
}

export default Login;