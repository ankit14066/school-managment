import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/authService';
import DashboardLayout from '../components/layout/DashboardLayout';
import Badge from '../components/Badge';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, profile } = useAuth();
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changing, setChanging] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChanging(true);
    try {
      await authAPI.updatePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      toast.success('Password updated');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally {
      setChanging(false);
    }
  };

  const infoRows = [
    { label: 'Email', value: user?.email },
    profile?.rollNumber && { label: 'Roll Number', value: profile.rollNumber },
    profile?.employeeId && { label: 'Employee ID', value: profile.employeeId },
    profile?.class && { label: 'Class', value: `Class ${profile.class.name}-${profile.class.section}` },
    profile?.phone && { label: 'Phone', value: profile.phone },
  ].filter(Boolean);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-title">👤 Profile</h1>
        <p className="page-subtitle">Account details &amp; security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-50">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-emerald-700 shadow-xs">
              {user?.name?.[0]}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">{user?.name}</h2>
              <Badge variant={user?.role}>{user?.role}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            {infoRows.map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center bg-slate-50/50 rounded-xl px-4 py-3 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <span className="text-sm font-bold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.008)]">
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div><label className="label">Current Password</label><input type="password" className="input-field" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required /></div>
            <div><label className="label">New Password</label><input type="password" className="input-field" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} minLength={6} required /></div>
            <div><label className="label">Confirm Password</label><input type="password" className="input-field" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} minLength={6} required /></div>
            <button type="submit" disabled={changing} className="btn-primary w-full">{changing ? 'Updating...' : 'Update Password'}</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
