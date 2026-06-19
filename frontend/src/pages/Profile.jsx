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

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-8">Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-600">
              {user?.name?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user?.name}</h2>
              <Badge variant={user?.role}>{user?.role}</Badge>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Email</span><span className="font-medium">{user?.email}</span></div>
            {profile?.rollNumber && <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Roll Number</span><span className="font-medium">{profile.rollNumber}</span></div>}
            {profile?.employeeId && <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Employee ID</span><span className="font-medium">{profile.employeeId}</span></div>}
            {profile?.class && <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Class</span><span className="font-medium">Class {profile.class.name}-{profile.class.section}</span></div>}
            {profile?.phone && <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Phone</span><span className="font-medium">{profile.phone}</span></div>}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
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
