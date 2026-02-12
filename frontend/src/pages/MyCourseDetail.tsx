import { useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileTypeBadge } from '@/lib/fileTypeUtils';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Edit2,
  Save,
  X,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Lock,
  Globe,
  Share2,
  Copy,
  RefreshCw,
  GripVertical,
  Calendar,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ImagePlus,
  GraduationCap,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SecureFileViewer from '@/features/courses/SecureFileViewer';
import FileAIActions from '@/features/courses/FileAIActions';
import FileAIViewer from '@/features/courses/FileAIViewer';
import { useAuth } from '@/contexts/AuthContext';
import { canCreatePublicCourses } from '@/features/auth/ProtectedRoute';
import UploadModal from '@/components/UploadModal';

interface CourseFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  fileType: string;
  fileSize: number;
  order: number;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  coverImage: string | null;
  bannerImage: string | null;
  category: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  shareToken?: string;
  isOwner: boolean;
  creator: {
    id: string;
    username: string;
    name: string;
  };
  files: CourseFile[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'LANGUAGES', label: 'Languages' },
  { value: 'HUMANITIES', label: 'Humanities' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'ARTS', label: 'Arts' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'LAW', label: 'Law' },
  { value: 'OTHER', label: 'Other' },
];

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-green-500" />;
  if (fileType.startsWith('video/')) return <Video className="h-5 w-5 text-brand-500" />;
  if (fileType.startsWith('audio/')) return <Music className="h-5 w-5 text-accent-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (fileType === 'application/zip') return <Archive className="h-5 w-5 text-yellow-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MyCourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    visibility: 'PRIVATE' as 'PRIVATE' | 'PUBLIC',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [viewingFile, setViewingFile] = useState<CourseFile | null>(null);
  const [aiViewerFile, setAiViewerFile] = useState<{
    file: CourseFile;
    tab: 'summary' | 'notes' | 'quiz' | 'flashcards';
  } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Check if user can create public courses (Premium/Admin only)
  const isPremium = canCreatePublicCourses(user?.role);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-course', id],
    queryFn: async () => {
      const response = await api.get(`/user-courses/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const response = await api.patch(`/user-courses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Course updated!');
      queryClient.invalidateQueries({ queryKey: ['user-course', id] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update course');
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/user-courses/${id}/files/${fileId}`);
    },
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['user-course', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete file');
    },
  });

  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, name }: { fileId: string; name: string }) => {
      const response = await api.patch(`/user-courses/${id}/files/${fileId}`, { name });
      return response.data;
    },
    onSuccess: () => {
      toast.success('File renamed');
      queryClient.invalidateQueries({ queryKey: ['user-course', id] });
      setEditingFileId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to rename file');
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/user-courses/${id}/regenerate-share-token`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Share link regenerated');
      queryClient.invalidateQueries({ queryKey: ['user-course', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to regenerate link');
    },
  });

  const reorderFilesMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      const response = await api.patch(`/user-courses/${id}/files/reorder`, { fileIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reorder files');
    },
  });

  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('banner', file);
      const response = await api.patch(`/user-courses/${id}/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Banner updated!');
      queryClient.invalidateQueries({ queryKey: ['user-course', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload banner');
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (visibility: 'PRIVATE' | 'PUBLIC') => {
      const response = await api.patch(`/user-courses/${id}`, { visibility });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Visibility updated!');
      queryClient.invalidateQueries({ queryKey: ['user-course', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update visibility');
    },
  });

  const handleDragStart = useCallback((fileId: string) => {
    setDraggedFileId(fileId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, fileId: string) => {
      e.preventDefault();
      if (draggedFileId !== fileId) {
        setDragOverFileId(fileId);
      }
    },
    [draggedFileId]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedFileId(null);
    setDragOverFileId(null);
  }, []);

  const handleDrop = useCallback(
    (targetFileId: string) => {
      if (!draggedFileId || draggedFileId === targetFileId) {
        handleDragEnd();
        return;
      }

      const files = [...(data?.course?.files || [])];
      const draggedIndex = files.findIndex((f) => f.id === draggedFileId);
      const targetIndex = files.findIndex((f) => f.id === targetFileId);

      if (draggedIndex === -1 || targetIndex === -1) {
        handleDragEnd();
        return;
      }

      // Reorder the files
      const [draggedFile] = files.splice(draggedIndex, 1);
      files.splice(targetIndex, 0, draggedFile);

      // Send new order to backend
      const fileIds = files.map((f) => f.id);
      reorderFilesMutation.mutate(fileIds);
      handleDragEnd();
    },
    [draggedFileId, data?.course?.files, handleDragEnd, reorderFilesMutation]
  );

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    uploadBannerMutation.mutate(file, {
      onSettled: () => setUploadingBanner(false),
    });

    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const moveFileUp = (fileId: string) => {
    const files = [...(data?.course?.files || [])];
    const index = files.findIndex((f) => f.id === fileId);
    if (index <= 0) return;

    [files[index - 1], files[index]] = [files[index], files[index - 1]];
    reorderFilesMutation.mutate(files.map((f) => f.id));
  };

  const moveFileDown = (fileId: string) => {
    const files = [...(data?.course?.files || [])];
    const index = files.findIndex((f) => f.id === fileId);
    if (index === -1 || index >= files.length - 1) return;

    [files[index], files[index + 1]] = [files[index + 1], files[index]];
    reorderFilesMutation.mutate(files.map((f) => f.id));
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setShowUploadModal(false);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        await api.post(`/user-courses/${id}/files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(progress);
          },
        });

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast.success(`${files.length} file(s) uploaded!`);
      queryClient.invalidateQueries({ queryKey: ['user-course', id] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadYouTube = async (url: string) => {
    setShowUploadModal(false);
    // YouTube upload for courses - placeholder, needs backend support
    console.log('YouTube URL:', url);
    toast.success('YouTube uploads coming soon for courses');
  };

  const course: Course | null = data?.course || null;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Course not found</p>
          <Link
            to="/courses"
            className="text-brand-600 dark:text-brand-400 hover:underline mt-2 inline-block"
          >
            ← Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = course.shareToken
    ? `${window.location.origin}/courses/${course.id}?token=${course.shareToken}`
    : `${window.location.origin}/courses/${course.id}`;

  return (
    <div className="h-full">
      {/* Enhanced Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        {/* Animated Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/30 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/30 dark:bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content Container */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation - Improved */}
          <div className="pt-6 pb-4">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Courses</span>
            </Link>
          </div>

          {/* Course Header Info */}
          <div className="pb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Banner Image (enhanced) */}
              {course.bannerImage && (
                <div className="relative w-full md:w-56 h-36 md:h-32 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/20 shadow-2xl group">
                  <img src={course.bannerImage} alt="" loading="lazy" className="w-full h-full object-cover" />
                  {course.isOwner && (
                    <>
                      <input
                        type="file"
                        ref={bannerInputRef}
                        onChange={handleBannerUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploadingBanner}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ImagePlus className="h-6 w-6 text-white" />
                          <span className="text-xs text-white font-medium">Change Image</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Title and Meta - Enhanced */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/20 text-white backdrop-blur-md border border-white/30">
                    {course.category.replace('_', ' ')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border ${
                      course.visibility === 'PUBLIC'
                        ? 'bg-emerald-500/30 text-white border-emerald-400/50'
                        : 'bg-white/20 text-white border-white/30'
                    }`}
                  >
                    {course.visibility === 'PUBLIC' ? (
                      <Globe className="h-3.5 w-3.5" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    {course.visibility}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                  {course.title}
                </h1>
                <div className="flex flex-wrap items-center gap-5 text-sm text-white/90">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{course.creator.name}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(course.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Banner Upload Button (if no banner) - Enhanced */}
              {course.isOwner && !course.bannerImage && (
                <div className="md:self-start">
                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={handleBannerUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 border-2 border-white/30 hover:border-white/40 rounded-xl transition-all duration-200 backdrop-blur-md active:scale-95 shadow-lg"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {uploadingBanner ? 'Uploading...' : 'Add Banner'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Files */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            {(course.description || isEditing) && (
              <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/50 rounded-xl shadow-lg p-6">
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateCourseMutation.mutate(editForm);
                    }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={4}
                        placeholder="Describe what students will learn..."
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Category
                        </label>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Visibility
                        </label>
                        <select
                          value={editForm.visibility}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              visibility: e.target.value as 'PRIVATE' | 'PUBLIC',
                            })
                          }
                          disabled={!isPremium && editForm.visibility !== 'PRIVATE'}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 cursor-pointer"
                        >
                          <option value="PRIVATE">Private</option>
                          <option value="PUBLIC" disabled={!isPremium}>
                            Public {!isPremium && '(Premium)'}
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 transition-[background-color,transform] duration-200 active:scale-95 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateCourseMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 transition-[background-image,box-shadow,transform] duration-200 active:scale-95 shadow-lg shadow-blue-500/30 font-semibold"
                      >
                        <Save className="h-4 w-4" />
                        {updateCourseMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      About this course
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {course.description || 'No description provided.'}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Files Section */}
            <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/50 rounded-xl shadow-lg overflow-hidden">
              <div className="p-5 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Course Files
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {course.files.length} file{course.files.length !== 1 ? 's' : ''} in this course
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Study Button - Always show if there are AI-compatible files */}
                  {course.files.some(
                    (f: CourseFile) =>
                      f.fileType === 'application/pdf' || f.fileType.startsWith('image/')
                  ) && (
                    <button
                      onClick={() => navigate(`/courses/${id}/study`)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30 font-semibold"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Study
                    </button>
                  )}
                  {course.isOwner && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-900 dark:hover:bg-white disabled:opacity-50 transition-all shadow-md border border-slate-700 dark:border-slate-200 font-semibold"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? `${Math.round(uploadProgress)}%` : 'Upload'}
                    </button>
                  )}
                </div>
              </div>

              {uploading && (
                <div className="px-5 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-violet-600 h-2 rounded-lg transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                </div>
              )}

              {course.files.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No files yet
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                    {course.isOwner
                      ? 'Upload PDFs, images, videos, or other learning materials to your course'
                      : 'No files have been added to this course yet'}
                  </p>
                  {course.isOwner && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20"
                    >
                      <Upload className="h-4 w-4" />
                      Upload your first file
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-200/50 dark:divide-white/10">
                  {course.files.map((file, index) => (
                    <div
                      key={file.id}
                      draggable={course.isOwner}
                      onDragStart={() => handleDragStart(file.id)}
                      onDragOver={(e) => handleDragOver(e, file.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={() => handleDrop(file.id)}
                      className={`p-4 flex items-center gap-4 transition-all ${
                        course.isOwner ? 'cursor-grab active:cursor-grabbing' : ''
                      } ${
                        draggedFileId === file.id ? 'opacity-50 bg-white/50 dark:bg-white/5' : ''
                      } ${
                        dragOverFileId === file.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-t-2 border-primary-500'
                          : ''
                      } hover:bg-white/30 dark:hover:bg-white/5`}
                    >
                      {course.isOwner && (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => moveFileUp(file.id)}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <GripVertical className="h-4 w-4 text-slate-400" />
                          <button
                            onClick={() => moveFileDown(file.id)}
                            disabled={index === course.files.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {getFileIcon(file.fileType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {editingFileId === file.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingFileName}
                              onChange={(e) => setEditingFileName(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-slate-300/50 dark:border-white/10 rounded-lg bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateFileMutation.mutate({
                                    fileId: file.id,
                                    name: editingFileName,
                                  });
                                } else if (e.key === 'Escape') {
                                  setEditingFileId(null);
                                }
                              }}
                            />
                            <button
                              onClick={() =>
                                updateFileMutation.mutate({
                                  fileId: file.id,
                                  name: editingFileName,
                                })
                              }
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingFileId(null)}
                              className="p-2 text-slate-500 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <FileTypeBadge mimeType={file.fileType} className="text-[10px] px-1.5 py-0.5" />
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatFileSize(file.fileSize)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingFile(file)}
                          className="p-2 text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                          title="View file"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* AI Actions */}
                        <FileAIActions
                          fileId={file.id}
                          fileName={file.name}
                          fileType={file.fileType}
                          onAction={(action) => setAiViewerFile({ file, tab: action })}
                        />

                        {course.isOwner && editingFileId !== file.id && (
                          <>
                            <button
                              onClick={() => {
                                setEditingFileId(file.id);
                                setEditingFileName(file.name);
                              }}
                              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Rename"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this file?')) {
                                  deleteFileMutation.mutate(file.id);
                                }
                              }}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/50 rounded-xl shadow-lg p-6">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Course Info
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold border border-slate-300 dark:border-slate-700">
                    {course.creator.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {course.creator.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      @{course.creator.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Created {formatDate(course.createdAt)}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>
                    {course.files.length} file{course.files.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Card (Owner only) */}
            {course.isOwner && (
              <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/50 rounded-xl shadow-lg p-6">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Actions
                </h3>

                <div className="space-y-3">
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => {
                      if (!isPremium && course.visibility === 'PRIVATE') {
                        toast.error('Public courses require Premium');
                        return;
                      }
                      toggleVisibilityMutation.mutate(
                        course.visibility === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE'
                      );
                    }}
                    disabled={toggleVisibilityMutation.isPending}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/50 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {course.visibility === 'PUBLIC' ? (
                        <Eye className="h-5 w-5 text-green-400" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-slate-400" />
                      )}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {course.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div
                      className={`relative w-11 h-6 rounded-lg transition-colors ${
                        course.visibility === 'PUBLIC'
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded bg-white shadow transition-transform ${
                          course.visibility === 'PUBLIC' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setEditForm({
                        title: course.title,
                        description: course.description || '',
                        category: course.category,
                        visibility: course.visibility,
                      });
                      setIsEditing(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200/50 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Edit Details
                    </span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200/50 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <Share2 className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Share Course
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-800/50 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Share Course</h2>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {course.visibility === 'PUBLIC'
                ? 'This course is public and visible to all Premium users in the course browser.'
                : 'Share this private link to give others access to your course.'}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 text-sm border border-slate-300/50 dark:border-white/10 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied!');
                }}
                className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-purple-500/20"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>

            {course.visibility === 'PRIVATE' && (
              <button
                onClick={() => regenerateTokenMutation.mutate()}
                disabled={regenerateTokenMutation.isPending}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${regenerateTokenMutation.isPending ? 'animate-spin' : ''}`}
                />
                Regenerate link (invalidates old links)
              </button>
            )}
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-800/50 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {getFileIcon(viewingFile.fileType)}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">{viewingFile.name}</h3>
                  <p className="text-xs text-slate-500">{formatFileSize(viewingFile.fileSize)}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingFile(null)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              <SecureFileViewer
                fileId={viewingFile.id}
                fileName={viewingFile.name}
                fileType={viewingFile.fileType}
                fileUrl={viewingFile.url}
                courseTitle={course.title}
                onClose={() => setViewingFile(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Viewer Modal */}
      {aiViewerFile && course && (
        <FileAIViewer
          fileId={aiViewerFile.file.id}
          fileName={aiViewerFile.file.name}
          courseTitle={course.title}
          initialTab={aiViewerFile.tab}
          onClose={() => setAiViewerFile(null)}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadFiles={handleFileUpload}
        onUploadYouTube={handleUploadYouTube}
        isUploading={uploading}
        requireContentAgreement={true}
      />
    </div>
  );
}
