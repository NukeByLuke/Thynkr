import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Trash2, Lock, Save, Camera } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

// Helper to build absolute URLs for files served by backend
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

  const [formData, setFormData] = useState({
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData({
      username: user?.username || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      const hasChanges =
        newData.username !== (user?.username || '') ||
        newData.firstName !== (user?.firstName || '') ||
        newData.lastName !== (user?.lastName || '') ||
        newData.email !== (user?.email || '');
      setIsDirty(hasChanges);
      return newData;
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.patch('/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsDirty(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

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

  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/me/avatar');
    },
    onSuccess: () => {
      toast.success('Avatar removed');
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove avatar');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      await api.patch('/users/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to change password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDirty) {
      updateProfileMutation.mutate(formData);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate();
  };

  const getUserInitial = () => {
    return user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="space-y-10">
      {/* Avatar Section */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Public Profile</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          This will be displayed on your profile.
        </p>
        
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center">
              {user?.avatarUrl ? (
                <img
                  src={toAbsoluteUrl(user.avatarUrl)}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-slate-400 dark:text-slate-500">
                  {getUserInitial()}
                </span>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer"
            >
              <Camera className="w-8 h-8 text-white" />
            </button>
          </div>
          
          <div className="space-y-3">
             <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatarMutation.mutate(file);
              }}
            />
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploadAvatarMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New
              </Button>
              {user?.avatarUrl && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => deleteAvatarMutation.mutate()}
                  isLoading={deleteAvatarMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recommended: 400x400px, max 2MB.
            </p>
          </div>
        </div>
      </section>

      <hr className="border-slate-200 dark:border-white/10" />

      {/* Basic Info Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Personal Details</h2>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Jane"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Doe"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
            <div className="relative">
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
             <div className="flex">
               <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                 thynkr.ca/u/
               </span>
               <input
                 name="username"
                 value={formData.username}
                 onChange={handleChange}
                 className="flex-1 px-4 py-2.5 rounded-r-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                 placeholder="janedoe"
               />
             </div>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              disabled={!isDirty || updateProfileMutation.isPending}
              isLoading={updateProfileMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </section>

       <hr className="border-slate-200 dark:border-white/10" />

      {/* Password Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Password & Security</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-2xl bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter current password"
                />
            </div>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="New password"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="Confirm new password"
                    />
                </div>
           </div>

           <div className="pt-2">
             <Button 
               type="submit" 
               variant="secondary"
               disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
               isLoading={changePasswordMutation.isPending}
             >
               Update Password
             </Button>
           </div>
        </form>
      </section>
    </div>
  );
}
