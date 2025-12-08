import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SecureFileViewer from '../components/SecureFileViewer';
import FileAIActions from '../components/FileAIActions';
import FileAIViewer from '../components/FileAIViewer';
import { CourseStudyPanel } from '../components/study';
import { useAuth } from '../contexts/AuthContext';
import { canCreatePublicCourses } from '../components/ProtectedRoute';

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

// Generate gradient based on course category
function getCategoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    MATHEMATICS: 'from-blue-500 to-indigo-600',
    SCIENCE: 'from-green-500 to-teal-600',
    TECHNOLOGY: 'from-brand-600 to-accent-600',
    ENGINEERING: 'from-orange-500 to-red-600',
    LANGUAGES: 'from-cyan-500 to-blue-600',
    HUMANITIES: 'from-amber-500 to-orange-600',
    BUSINESS: 'from-slate-500 to-gray-700',
    ARTS: 'from-rose-500 to-pink-600',
    HEALTH: 'from-emerald-500 to-green-600',
    LAW: 'from-brand-600 to-accent-600',
    OTHER: 'from-gray-500 to-slate-600',
  };
  return gradients[category] || gradients['OTHER'];
}

export default function MyCourseDetail() {
  const { id } = useParams<{ id: string }>();
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

  // Study Panel
  const [showStudyPanel, setShowStudyPanel] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      {/* Hero Banner with Overlay */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {course.bannerImage ? (
          <img src={course.bannerImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(course.category)}`}
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Back Button - Floating */}
        <Link
          to="/courses"
          className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Courses</span>
        </Link>

        {/* Banner Upload Button (Owner only) */}
        {course.isOwner && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
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
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">
                {uploadingBanner ? 'Uploading...' : 'Change Banner'}
              </span>
            </button>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 text-xs font-medium text-white bg-white/20 backdrop-blur-sm rounded-full">
                {course.category.replace('_', ' ')}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                  course.visibility === 'PUBLIC'
                    ? 'bg-green-500/20 text-green-100'
                    : 'bg-gray-500/20 text-gray-100'
                }`}
              >
                {course.visibility === 'PUBLIC' ? (
                  <Globe className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {course.visibility}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
              {course.title}
            </h1>
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateCourseMutation.mutate(editForm);
                    }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={4}
                        placeholder="Describe what students will learn..."
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category
                        </label>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 cursor-pointer"
                        >
                          <option value="PRIVATE">Private</option>
                          <option value="PUBLIC" disabled={!isPremium}>
                            Public {!isPremium && '(Premium)'}
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateCourseMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/25"
                      >
                        <Save className="h-4 w-4" />
                        {updateCourseMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      About this course
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {course.description || 'No description provided.'}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Files Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Course Files
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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
                      onClick={() => setShowStudyPanel(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-xl hover:from-brand-700 hover:to-accent-700 transition-all shadow-lg shadow-brand-500/25"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Study
                    </button>
                  )}
                  {course.isOwner && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mp3,.wav,.zip"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/25"
                      >
                        <Upload className="h-4 w-4" />
                        {uploading ? `${Math.round(uploadProgress)}%` : 'Upload'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {uploading && (
                <div className="px-5 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
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
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No files yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    {course.isOwner
                      ? 'Upload PDFs, images, videos, or other learning materials to your course'
                      : 'No files have been added to this course yet'}
                  </p>
                  {course.isOwner && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Upload your first file
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
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
                        draggedFileId === file.id ? 'opacity-50 bg-gray-100 dark:bg-gray-700' : ''
                      } ${
                        dragOverFileId === file.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-t-2 border-primary-500'
                          : ''
                      } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                    >
                      {course.isOwner && (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            onClick={() => moveFileUp(file.id)}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <button
                            onClick={() => moveFileDown(file.id)}
                            disabled={index === course.files.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700">
                        {getFileIcon(file.fileType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {editingFileId === file.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingFileName}
                              onChange={(e) => setEditingFileName(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {formatFileSize(file.fileSize)}
                            </p>
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Course Info
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                    {course.creator.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {course.creator.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{course.creator.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Created {formatDate(course.createdAt)}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>
                    {course.files.length} file{course.files.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Card (Owner only) */}
            {course.isOwner && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
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
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {course.visibility === 'PUBLIC' ? (
                        <Eye className="h-5 w-5 text-green-500" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {course.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        course.visibility === 'PUBLIC'
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
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
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit2 className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Edit Details
                    </span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Share2 className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share Course</h2>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {course.visibility === 'PUBLIC'
                ? 'This course is public and visible to all Premium users in the course browser.'
                : 'Share this private link to give others access to your course.'}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied!');
                }}
                className="p-3 bg-primary-600 text-white hover:bg-primary-700 rounded-xl transition-colors"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>

            {course.visibility === 'PRIVATE' && (
              <button
                onClick={() => regenerateTokenMutation.mutate()}
                disabled={regenerateTokenMutation.isPending}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                  {getFileIcon(viewingFile.fileType)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{viewingFile.name}</h3>
                  <p className="text-xs text-gray-500">{formatFileSize(viewingFile.fileSize)}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingFile(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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

      {/* Course Study Panel */}
      {showStudyPanel && course && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-brand-600 to-accent-600 rounded-xl">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Study Mode</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{course.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowStudyPanel(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CourseStudyPanel
                courseId={course.id}
                courseTitle={course.title}
                onClose={() => setShowStudyPanel(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
