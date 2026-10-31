import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Shield, UserX, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api';

export default function StaffView() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  
  const hasMinLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers('staff');
      setStaffList(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError("Password must meet all complexity requirements (>8 chars, uppercase, lowercase, special character)");
      return;
    }

    try {
      await api.createStaff({
        email,
        full_name: fullName,
        password,
        role: 'staff'
      });
      setShowAddModal(false);
      setEmail('');
      setFullName('');
      setPassword('');
      await loadStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await api.toggleUserStatus(userId);
      await loadStaff();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800 }}>Internal Staff Administration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Security policy: Only an administrator is authorized to create and manage internal staff accounts.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Email</th>
              <th>Assigned Role</th>
              <th>Account Status</th>
              <th>Created On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No staff accounts configured.
                </td>
              </tr>
            ) : (
              staffList.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {s.full_name}
                  </td>
                  <td>{s.email}</td>
                  <td>
                    <span className="badge confirmed">
                      <UserCheck size={12} />
                      Internal Staff
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.is_active ? 'active' : 'cancelled'}`}>
                      <span className="badge-dot" />
                      {s.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleToggleStatus(s.id)}
                    >
                      {s.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Staff */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <UserCheck size={20} color="var(--primary)" />
                Create Internal Staff Account
              </h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Samantha Staff"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="staff@brightloop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.625rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Complexity Requirements:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                    <span style={{ color: hasMinLength ? '#10b981' : '#64748b' }}>{hasMinLength ? '✓' : '○'} &gt; 8 characters</span>
                    <span style={{ color: hasUpper ? '#10b981' : '#64748b' }}>{hasUpper ? '✓' : '○'} 1 uppercase</span>
                    <span style={{ color: hasLower ? '#10b981' : '#64748b' }}>{hasLower ? '✓' : '○'} 1 lowercase</span>
                    <span style={{ color: hasSpecial ? '#10b981' : '#64748b' }}>{hasSpecial ? '✓' : '○'} 1 special char</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!isPasswordValid}>Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
