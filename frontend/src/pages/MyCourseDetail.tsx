import { useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
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

// Category accent colors (subtle, for small badges only)
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MATHEMATICS: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  SCIENCE: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  TECHNOLOGY: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  ENGINEERING: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  LANGUAGES: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  HUMANITIES: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  BUSINESS: { bg: 'bg-slate-100 dark:bg-slate-800/40', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
  ARTS: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
  HEALTH: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  LAW: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  OTHER: { bg: 'bg-gray-50 dark:bg-gray-800/40', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
};

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
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('token');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
    queryKey: ['user-course', id, shareToken],
    queryFn: async () => {
      const url = shareToken
        ? `/user-courses/${id}?token=${shareToken}`
        : `/user-courses/${id}`;
      const response = await api.get(url);
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
    const status = (error as any)?.response?.status;
    const isAccessDenied = status === 403;
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {isAccessDenied
              ? 'You don\'t have access to this course'
              : 'Course not found'}
          </p>
          {isAccessDenied && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ask the course owner to share it with you.
            </p>
          )}
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

  const catColor = CATEGORY_COLORS[course.category] || CATEGORY_COLORS.OTHER;

  return (
    <div className="h-full">
      {/* Cover Banner */}
      {course.bannerImage ? (
        <div className="relative w-full h-40 sm:h-48 bg-slate-100 dark:bg-zinc-900 group">
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
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Change cover
              </button>
            </>
          )}
        </div>
      ) : course.isOwner ? (
        <div className="w-full group">
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
            className="w-full h-12 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.02] border-b border-slate-200/70 dark:border-white/[0.06] opacity-0 hover:opacity-100 transition-all"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {uploadingBanner ? 'Uploading...' : 'Add a cover image'}
          </button>
        </div>
      ) : null}

      {/* Header */}
      <div className="border-b border-slate-200/70 dark:border-white/[0.06] bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="pt-5 pb-3">
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Courses
            </Link>
          </div>

          {/* Title Row */}
          <div className="pb-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                {course.category.replace('_', ' ')}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                  course.visibility === 'PUBLIC'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
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
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {course.creator.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(course.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {course.files.length} file{course.files.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Files */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description Card */}
            {(course.description || isEditing) && (
              <div className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-zinc-900/80 p-5">
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
                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-lg border border-slate-200 dark:border-white/10 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateCourseMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors font-medium"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {updateCourseMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      About
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {course.description || 'No description provided.'}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Files Section */}
            <div className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-zinc-900/80 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Files
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {course.files.length} file{course.files.length !== 1 ? 's' : ''} in this course
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Study Button */}
                  {course.files.some(
                    (f: CourseFile) =>
                      f.fileType === 'application/pdf' || f.fileType.startsWith('image/')
                  ) && (
                    <button
                      onClick={() => navigate(`/courses/${id}/study${shareToken ? `?token=${shareToken}` : ''}`)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Study
                    </button>
                  )}
                  {course.isOwner && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? `${Math.round(uploadProgress)}%` : 'Upload'}
                    </button>
                  )}
                </div>
              </div>

              {uploading && (
                <div className="px-4 py-2.5 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                </div>
              )}

              {course.files.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    No files yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
                    {course.isOwner
                      ? 'Upload PDFs, documents, or images to study with AI'
                      : 'No files have been added to this course yet'}
                  </p>
                  {course.isOwner && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Upload file
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {course.files.map((file, index) => (
                    <div
                      key={file.id}
                      draggable={course.isOwner}
                      onDragStart={() => handleDragStart(file.id)}
                      onDragOver={(e) => handleDragOver(e, file.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={() => handleDrop(file.id)}
                      className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                        course.isOwner ? 'cursor-grab active:cursor-grabbing' : ''
                      } ${
                        draggedFileId === file.id ? 'opacity-50' : ''
                      } ${
                        dragOverFileId === file.id
                          ? 'bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-500'
                          : ''
                      } hover:bg-slate-50 dark:hover:bg-white/[0.02]`}
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

                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.04]">
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
          <div className="space-y-5">
            {/* Author Card */}
            <div className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-zinc-900/80 p-5">
              <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Course Info
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-sm text-slate-600 dark:text-slate-300 font-semibold">
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

                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created {formatDate(course.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <FileText className="h-3.5 w-3.5" />
                  <span>
                    {course.files.length} file{course.files.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Card (Owner only) */}
            {course.isOwner && (
              <div className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-zinc-900/80 p-5">
                <h3 className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  Actions
                </h3>

                <div className="space-y-1.5">
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
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {course.visibility === 'PUBLIC' ? (
                        <Eye className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {course.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        course.visibility === 'PUBLIC'
                          ? 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          course.visibility === 'PUBLIC' ? 'translate-x-5' : 'translate-x-0.5'
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
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <Edit2 className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Edit Details
                    </span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <Share2 className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Share Course</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {course.visibility === 'PUBLIC'
                ? 'This course is public and visible to all Premium users.'
                : 'Share this private link to give others access.'}
            </p>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied!');
                }}
                className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                <Copy className="h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.04]">
                  {getFileIcon(viewingFile.fileType)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">{viewingFile.name}</h3>
                  <p className="text-xs text-slate-500">{formatFileSize(viewingFile.fileSize)}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingFile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
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
