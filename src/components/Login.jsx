import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import logoImg from '../assets/logo.png';
import { Lock, User, AlertCircle, ChefHat, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login } = useContext(AppContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }
    const result = await login(username, password);
    if (!result.success) {
      setError(result.message || 'Invalid username or password. Please try again.');
    } else {
      setError('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(128, 0, 32, 0.04) 0%, transparent 60%), radial-gradient(circle at 90% 80%, rgba(255, 153, 51, 0.05) 0%, transparent 60%), var(--bg-primary)',
      padding: '1.5rem'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
        border: '1px solid var(--border-color-active)',
        borderRadius: '24px',
        background: 'rgba(250, 249, 245, 0.85)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1rem',
            background: 'var(--primary-grad)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(128, 0, 32, 0.2)'
          }}>
            <img src={logoImg} alt="Sri Mayyia Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Sri Mayyia Caterers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Enterprise Catering Operations Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(185, 28, 28, 0.1)',
            border: '1px solid rgba(185, 28, 28, 0.2)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            color: 'var(--color-danger)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={14} style={{ color: 'var(--color-primary)' }} />
              <span>Username / Account ID</span>
            </label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={14} style={{ color: 'var(--color-primary)' }} />
              <span>Secure Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            style={{
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(128, 0, 32, 0.25)',
              marginTop: '0.5rem'
            }}
          >
            Authenticate Portal Session
          </button>
        </form>


      </div>
    </div>
  );
};

export default Login;
