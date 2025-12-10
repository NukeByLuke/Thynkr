import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTTS, TTS_VOICES, TTS_SPEEDS, TTSVoice } from '@/contexts/TTSContext';
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
  Volume2,
  Play,
  Loader2,
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

// TTS Settings Component
function TTSSettings() {
  const { voice, speed, setVoice, setSpeed, play, isLoading } = useTTS();
  const [testPlaying, setTestPlaying] = useState(false);

  const handleTestVoice = async () => {
    setTestPlaying(true);
    try {
      await play({
        id: 'tts-test',
        title: 'Voice Test',
        text: 'Hello! This is a preview of your selected voice and speed settings. Adjust them to find what works best for you.',
      });
    } finally {
      setTestPlaying(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Volume2 className="w-5 h-5" />
        Voice Reader Settings
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Customize how text-to-speech reads your study materials
      </p>

      <div className="space-y-6">
        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Voice
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TTS_VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVoice(v.id as TTSVoice)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  voice === v.id
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <p
                  className={`font-medium ${
                    voice === v.id
                      ? 'text-brand-700 dark:text-brand-300'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {v.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Speed Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Playback Speed
          </label>
          <div className="flex gap-2">
            {TTS_SPEEDS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSpeed(s.value)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  speed === s.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test Voice Button */}
        <div className="pt-2">
          <button
            onClick={handleTestVoice}
            disabled={isLoading || testPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all"
          >
            {isLoading || testPlaying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Test Voice
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Hear a sample with your current voice and speed settings
          </p>
        </div>
      </div>
    </div>
  );
}

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
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-slate-700/20 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2 tracking-wide">
                  <User className="w-5 h-5" />
                  Profile Information
                </h2>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {/* Avatar Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                ? 'border-brand-500 ring-2 ring-brand-300'
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                            onError={() => {
                              console.error('Failed to load avatar:', avatarPreview);
                              // Don't hide on error, just log it
                            }}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                            <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
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
                          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                        >
                          <Image className="w-4 h-4 inline mr-2" />
                          Change Picture
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG up to 2MB
                          {avatarFile && (
                            <span className="text-brand-600 dark:text-brand-400 font-medium">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    {user?.username && !isEditingUsername ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={username}
                          disabled
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingUsername(true)}
                          className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This is your unique identifier across the platform
                    </p>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      />
                      {user?.emailVerified && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Language Preference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Preferred Language
                    </label>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Generated summaries, notes, quizzes, and flashcards will be in this language
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center gap-2"
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-slate-700/20 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2 tracking-wide">
                  <Lock className="w-5 h-5" />
                  Change Password
                </h2>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>

              {/* Appearance */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-slate-700/20 p-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2 tracking-wide">
                  {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  Appearance
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-3">Theme Mode</p>
                    <div className="space-y-3">
                      {/* Light Mode Option */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={themeMode === 'light'}
                          onChange={() => handleThemeChange('light')}
                          className="w-4 h-4 text-brand-600 focus:ring-brand-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">Light</span>
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
                          className="w-4 h-4 text-brand-600 focus:ring-brand-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">Dark</span>
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
                          className="w-4 h-4 text-brand-600 focus:ring-brand-500 focus:ring-2"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-600 dark:border-gray-400 relative">
                            <div className="absolute inset-0 flex">
                              <div className="w-1/2 bg-gray-300 dark:bg-gray-600 rounded-l-full"></div>
                              <div className="w-1/2 bg-gray-700 dark:bg-gray-300 rounded-r-full"></div>
                            </div>
                          </div>
                          <span className="text-gray-900 dark:text-white">
                            System{' '}
                            {themeMode === 'system' && `(${theme === 'light' ? 'Light' : 'Dark'})`}
                          </span>
                        </div>
                      </label>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      {themeMode === 'system'
                        ? 'Automatically matches your operating system theme'
                        : `Theme is set to ${themeMode} mode regardless of system preference`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <TTSSettings />

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-sm p-6">
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
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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
