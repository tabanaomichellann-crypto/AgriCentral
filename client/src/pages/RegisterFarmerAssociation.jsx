import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerFarmerAssociation } from '../services/api';
import '../styles/Auth.css';
import logo from '../assets/AgriCentral_Logo.png';

function RegisterFarmerAssociation() {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await registerFarmerAssociation({
        fullName: form.fullName,
        username: form.username,
        password: form.password
      });

      setSuccess('Registration successful. You can now sign in.');
      setTimeout(() => navigate('/login'), 1400);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError('Cannot connect to the server. Please make sure the backend API is running on port 5000.');
      } else {
        setError('Registration failed. Please try again.');
      }
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
          <p>Register as a Farmer Association Representative to request support and resources.</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Sign Up</h2>
          <p className="auth-sub">Create your representative account</p>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="auth-hint auth-hint-action">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterFarmerAssociation;
