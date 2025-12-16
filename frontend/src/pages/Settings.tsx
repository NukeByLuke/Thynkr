import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import PageContainer from '@/components/layout/PageContainer';
import {
  User,
  Lock,
  Image,
  Moon,
  Sun,
  Trash2,
  Save,
  PencilLine,
  Globe,
} from 'lucide-react';
import api from '../lib/api';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'it', label: 'Italiano (Italian)' },
  { code: 'pt', label: 'Português (Portuguese)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'ko', label: '한국어 (Korean)' },
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ru', label: 'Русский (Russian)' },
];

// Helper to build absolute URLs for files served by backend (/uploads/...)
const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';
const ASSET_BASE = API_BASE.replace(/\/_?api$/, '');
const toAbsoluteUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // In dev, prefer relative paths so Vite can proxy /uploads via the same origin (works with tunnels)
  if (import.meta.env.DEV && url.startsWith('/')) return url;
  return `${ASSET_BASE}${url}`;
};

export default function Settings() {
  const { user, logout, refetchUser } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [username, setUsername] = useState(user?.username || '');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');

  // Update preview when user data changes (after refetch or account switch)
  useEffect(() => {
    if (user) {
      setAvatarPreview(user.avatarUrl ? toAbsoluteUrl(user.avatarUrl) : '');
      setUsername(user.username || '');
      setPreferredLanguage(user.preferredLanguage || 'en');
      setIsEditingUsername(false);
      setAvatarFile(null);
    }
  }, [user?.id, user?.avatarUrl, user?.username, user?.preferredLanguage]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      username?: string;
      avatarUrl?: string;
      preferredLanguage?: string;
    }) => {
      const response = await api.patch('/auth/profile', data);
      return response.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await refetchUser(); // Refresh the user in AuthContext so avatar/username show immediately
      toast.success('Profile updated successfully!');
      setIsEditingUsername(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.post('/auth/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to change password');
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/auth/account');
      return response.data;
    },
    onSuccess: () => {
      logout();
      toast.success('Account deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload avatar if a new file was selected
    let avatarUrl = user?.avatarUrl;
    if (avatarFile) {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      try {
        const uploadToast = toast.loading('Uploading profile picture...');

        // Use api instance which handles auth headers automatically
        // Do NOT set Content-Type manually; axios will set the proper multipart boundary
        const response = await api.post('/auth/upload-avatar', formData);

        if (response.data.avatarUrl) {
          avatarUrl = response.data.avatarUrl;
          setAvatarFile(null); // Clear the file after successful upload
          setAvatarPreview(toAbsoluteUrl(response.data.avatarUrl)); // Update preview with absolute URL
          toast.success('Profile picture uploaded successfully', { id: uploadToast });
        } else {
          toast.error('Failed to upload profile picture', { id: uploadToast });
          return; // Don't proceed with profile update if upload failed
        }
      } catch (error: any) {
        console.error('Avatar upload failed:', error);
        const errorMessage = error.response?.data?.error || 'Failed to upload profile picture';
        toast.error(errorMessage);
        return; // Don't proceed with profile update if upload failed
      }
    }

    // Update profile with new username and avatar URL (only if something changed)
    if (
      username !== user?.username ||
      avatarUrl !== user?.avatarUrl ||
      preferredLanguage !== user?.preferredLanguage
    ) {
      updateProfileMutation.mutate({
        username: username || undefined,
        avatarUrl,
        preferredLanguage,
      });
    } else {
      toast.success('No changes to save');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    toast.success(
      `Theme set to ${mode === 'system' ? 'System preference' : mode === 'light' ? 'Light mode' : 'Dark mode'}`
    );
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        'Are you sure you want to delete your account? This action cannot be undone and will delete all your files and data.'
      )
    ) {
      deleteAccountMutation.mutate();
    }
  };

  // If no user, don't render (shouldn't happen on protected route)
  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Settings - Thynkr</title>
        <meta
          name="description"
          content="Manage your Thynkr account settings, profile, and preferences"
        />
      </Helmet>

      <div key={user.id} className="h-full flex flex-col">
        <PageContainer>
          <PageContainer.Header subtitle="Manage your account and preferences">
            Settings
          </PageContainer.Header>

          <div className="space-y-6">
              {/* Profile Settings */}
              <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-white/10 p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2 tracking-wide">
                  <User className="w-5 h-5 text-indigo-500" />
                  Profile Information
                </h2>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {/* Avatar Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar"
                            className={`w-20 h-20 rounded-full object-cover border-2 ${
                              avatarFile
                                ? 'border-indigo-500 ring-2 ring-indigo-300 shadow-lg shadow-indigo-500/30'
                                : 'border-slate-200 dark:border-slate-600'
                            }`}
                            onError={() => {
                              console.error('Failed to load avatar:', avatarPreview);
                              // Don't hide on error, just log it
                            }}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600">
                            <User className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                          </div>
                        )}
                        {avatarFile && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
                        >
                          <Image className="w-4 h-4 inline mr-2" />
                          Change Picture
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          PNG, JPG up to 2MB
                          {avatarFile && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              {' '}
                              • New image selected
                            </span>
                          )}
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Username
                    </label>
                    {user?.username && !isEditingUsername ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={username}
                          disabled
                          className="flex-1 px-4 py-2 border border-slate-200/50 dark:border-white/10 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed backdrop-blur-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingUsername(true)}
                          className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200/50 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-300"
                          aria-label="Edit username"
                        >
                          <PencilLine className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a unique username"
                        required
                        className="w-full px-4 py-2 border border-slate-200/50 dark:border-white/10 dark:bg-slate-800/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                      />
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      This is your unique identifier across the platform
                    </p>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="flex-1 px-4 py-2 border border-slate-200/50 dark:border-white/10 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed backdrop-blur-sm"
                      />
                      {user?.emailVerified && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Language Preference */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Preferred Language
                    </label>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200/50 dark:border-white/10 dark:bg-slate-800/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Generated summaries, notes, quizzes, and flashcards will be in this language
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
                  >
                    <Save className="w-4 h-4" />
                    {updateProfileMutation.isPending
                      ? 'Saving...'
                      : avatarFile
                        ? 'Upload & Save Profile'
                        : 'Save Profile'}
                  </button>
                </form>
              </div>

              {/* Password Change */}
              <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-white/10 p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2 tracking-wide">
                  <Lock className="w-5 h-5 text-indigo-500" />
                  Change Password
                </h2>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200/50 dark:border-white/10 dark:bg-slate-800/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200/50 dark:border-white/10 dark:bg-slate-800/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200/50 dark:border-white/10 dark:bg-slate-800/50 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
                  >
                    {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>

              {/* Appearance */}
              <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-white/10 p-6">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2 tracking-wide">
                  {theme === 'light' ? <Sun className="w-5 h-5 text-indigo-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                  Appearance
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white mb-3">Theme Mode</p>
                    <div className="space-y-3">
                      {/* Light Mode Option */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={themeMode === 'light'}
                          onChange={() => handleThemeChange('light')}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <span className="text-slate-900 dark:text-white">Light</span>
                        </div>
                      </label>

                      {/* Dark Mode Option */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={themeMode === 'dark'}
                          onChange={() => handleThemeChange('dark')}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <span className="text-slate-900 dark:text-white">Dark</span>
                        </div>
                      </label>

                      {/* System Mode Option */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="theme"
                          value="system"
                          checked={themeMode === 'system'}
                          onChange={() => handleThemeChange('system')}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-slate-600 dark:border-slate-400 relative">
                            <div className="absolute inset-0 flex">
                              <div className="w-1/2 bg-slate-300 dark:bg-slate-600 rounded-l-full"></div>
                              <div className="w-1/2 bg-slate-700 dark:bg-slate-300 rounded-r-full"></div>
                            </div>
                          </div>
                          <span className="text-slate-900 dark:text-white">
                            System{' '}
                            {themeMode === 'system' && `(${theme === 'light' ? 'Light' : 'Dark'})`}
                          </span>
                        </div>
                      </label>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                      {themeMode === 'system'
                        ? 'Automatically matches your operating system theme'
                        : `Theme is set to ${themeMode} mode regardless of system preference`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50/70 dark:bg-red-900/20 backdrop-blur-xl border border-red-200/50 dark:border-red-800/50 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </h2>

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
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40"
                  >
                    {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
        </PageContainer>
      </div>
    </>
  );
}
