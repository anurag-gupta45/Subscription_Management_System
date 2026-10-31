import React from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  User, 
  LogOut, 
  Layers, 
  Zap,
  Sparkles
} from 'lucide-react';

export default function Navbar({ currentUser, onSwitchDemoRole, onOpenAuth, onLogout }) {
  return (
    <header className="top-navbar">
      <div className="page-title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="role-badge-pill">
            {currentUser?.role === 'admin' && <ShieldCheck size={14} color="#6366f1" />}
            {currentUser?.role === 'staff' && <UserCheck size={14} color="#06b6d4" />}
            {currentUser?.role === 'customer' && <User size={14} color="#10b981" />}
            <span style={{ textTransform: 'capitalize' }}>
              {currentUser?.role || 'Guest'} Mode
            </span>
          </div>

          <span style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
            Brightloop Software v1.0
          </span>
        </div>
      </div>

      <div className="top-actions-row">
        {}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Demo Switcher:
          </span>
          <select 
            className="role-switcher-select"
            value={currentUser?.role || ''}
            onChange={(e) => onSwitchDemoRole(e.target.value)}
          >
            <option value="admin">Admin (Alex Administrator)</option>
            <option value="staff">Internal Staff (Samantha Staff)</option>
            <option value="customer">Customer (Acme Corp / John)</option>
          </select>
        </div>

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div className="user-profile-menu">
              <div className="avatar-circle">
                {currentUser.full_name?.charAt(0) || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>
                  {currentUser.full_name}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {currentUser.email}
                </span>
              </div>
            </div>

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onLogout}
              title="Sign Out"
              style={{ padding: '0.45rem 0.75rem' }}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
}
