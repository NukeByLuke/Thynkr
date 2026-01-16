import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { User, Image, Lock, Save, Volume2, Mail, Type } from 'lucide-react';
import api from '@/lib/api';
import SmartInput from '@/components/SmartInput';
import SaveChangesBar from '@/components/SaveChangesBar';
import SettingsSection from '@/components/settings/SettingsSection';

// Helper to build absolute URLs for files served by backend (/uploads/...)
const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';
const ASSET_BASE = API_BASE.replace(/\/_?api$/, '');
const toAbsoluteUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (import.meta.env.DEV && url.startsWith('/')) return url;
  return `${ASSET_BASE}${url}`;
};

export default function ProfileSettings() {
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Track if form is dirty
  const [isDirty, setIsDirty] = useState(false);

  // Update isDirty when fields change
  useEffect(() => {
    const hasChanges = 
      username !== (user?.username || '') ||
      firstName !== (user?.firstName || '') ||
      lastName !== (user?.lastName || '') ||
      email !== (user?.email || '');
    setIsDirty(hasChanges);
  }, [username, firstName, lastName, email, user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username?: string; firstName?: string; lastName?: string; email?: string }) => {
      const response = await api.patch('/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Avatar updated successfully');
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    },
  });

  // Delete avatar mutation
  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/users/me/avatar');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Avatar removed successfully');
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove avatar');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.patch('/users/me/password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/users/me');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    },
  });

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate({ username, firstName, lastName, email });
  };

  const handleSaveChanges = () => {
    handleProfileUpdate();
  };

  const handleDiscardChanges = () => {
    setUsername(user?.username || '');
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setIsDirty(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
      )
    ) {
      deleteAccountMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <SettingsSection title="Profile Information">
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Profile Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {user?.avatarUrl ? (
                  <img
                    src={toAbsoluteUrl(user.avatarUrl)}
                    alt={user.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  <Image className="w-4 h-4" />
                  {uploadAvatarMutation.isPending ? 'Uploading...' : 'Upload'}
                </button>
                {user?.avatarUrl && (
                  <button
                    onClick={() => deleteAvatarMutation.mutate()}
                    disabled={deleteAvatarMutation.isPending}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username
            </label>
            <SmartInput
              icon={<User className="w-5 h-5" />}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                First Name
              </label>
              <SmartInput
                icon={<Type className="w-5 h-5" />}
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Last Name
              </label>
              <SmartInput
                icon={<Type className="w-5 h-5" />}
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email Address
            </label>
            <SmartInput
              icon={<Mail className="w-5 h-5" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleProfileUpdate}
              disabled={updateProfileMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Voice & Study Preferences */}
      <SettingsSection 
        title="Voice & Study Preferences" 
        description="Customize your learning experience with text-to-speech and study settings"
      >
        <div className="space-y-6">
          {/* TTS Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Preferred Voice
            </label>
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-slate-400" />
              <select className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all">
                <option value="alloy">Alloy - Neutral, balanced voice</option>
                <option value="echo">Echo - Warm, conversational voice</option>
                <option value="fable">Fable - Expressive, narrative voice</option>
                <option value="onyx">Onyx - Deep, authoritative voice</option>
                <option value="nova">Nova - Friendly, energetic voice</option>
                <option value="shimmer">Shimmer - Clear, pleasant voice</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Choose your default text-to-speech voice for study materials
            </p>
          </div>

          {/* Study Settings Placeholder */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Auto-play Audio
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Automatically play text-to-speech when opening study materials
              </span>
            </label>
          </div>
        </div>
      </SettingsSection>

      {/* Change Password */}
      <SettingsSection title="Change Password" description="Update your password to keep your account secure">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Current Password
            </label>
            <SmartInput
              icon={<Lock className="w-5 h-5" />}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              New Password
            </label>
            <SmartInput
              icon={<Lock className="w-5 h-5" />}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Confirm New Password
            </label>
            <SmartInput
              icon={<Lock className="w-5 h-5" />}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handlePasswordChange}
              disabled={changePasswordMutation.isPending}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="Danger Zone" variant="danger">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-900 dark:text-red-400">Delete Account</p>
            <p className="text-sm text-red-700 dark:text-red-300">
              Permanently delete your account and all associated data
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </SettingsSection>

      {/* Floating Save Changes Bar */}
      <SaveChangesBar
        isDirty={isDirty}
        onSave={handleSaveChanges}
        onDiscard={handleDiscardChanges}
        isSaving={updateProfileMutation.isPending}
      />
    </div>
  );
}
