import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen,
  Sparkles,
  Trash2,
  Edit2,
  Clock,
  FileText,
  GraduationCap,
  Search,
  X,
  Check,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useTierAccess } from '../components/UpgradePrompt';
import StudyPackViewer from '../components/StudyPackViewer';
import LoadingSpinner from '../components/LoadingSpinner';

interface StudyPack {
  id: string;
  title: string;
  fileCount: number;
  pageCount: number;
  quizCount: number;
  cardCount: number;
  courseId: string | null;
  courseName: string | null;
  hasShareToken: boolean;
  createdAt: string;
  updatedAt: string;
}

type FilterType = 'all' | 'course' | 'general';

export default function SavedPacks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasStandardAccess } = useTierAccess(user?.role);

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudyPackId, setActiveStudyPackId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Fetch study packs
  const { data, isLoading, error } = useQuery({
    queryKey: ['study-packs'],
    queryFn: async () => {
      const response = await api.get('/ai/study-packs');
      return response.data;
    },
    enabled: hasStandardAccess,
  });

  const studyPacks: StudyPack[] = data?.studyPacks || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ai/study-pack/${id}`);
    },
    onSuccess: () => {
      toast.success('Study pack deleted');
      queryClient.invalidateQueries({ queryKey: ['study-packs'] });
    },
    onError: () => {
      toast.error('Failed to delete study pack');
    },
  });

  // Update title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await api.patch(`/ai/study-pack/${id}`, { title });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Title updated');
      queryClient.invalidateQueries({ queryKey: ['study-packs'] });
      setEditingId(null);
    },
    onError: () => {
      toast.error('Failed to update title');
    },
  });

  // Filter packs
  const filteredPacks = studyPacks.filter((pack) => {
    // Filter by type
    if (filter === 'course' && !pack.courseId) return false;
    if (filter === 'general' && pack.courseId) return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        pack.title.toLowerCase().includes(query) ||
        (pack.courseName && pack.courseName.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleStartEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const handleSaveTitle = (id: string) => {
    if (editingTitle.trim()) {
      updateTitleMutation.mutate({ id, title: editingTitle.trim() });
    } else {
      setEditingId(null);
    }
  };

  // Show upgrade prompt for non-Standard+ users
  if (!hasStandardAccess) {
    return (
      <>
        <Helmet>
          <title>Saved Packs - Thynkr</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Study Packs Require Standard+
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upgrade to Standard or Premium to create and save study packs from multiple files.
                Combine your materials into unified study experiences with AI-generated summaries,
                quizzes, and flashcards.
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
              >
                <Sparkles className="w-5 h-5" />
                Upgrade Now
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load study packs</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Saved Packs - Thynkr</title>
        <meta
          name="description"
          content="Your saved study packs - combined multi-file study materials"
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Packs</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Your combined study packs from multiple files
            </p>
          </div>

          {/* Filters & Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('course')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    filter === 'course'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Course
                </button>
                <button
                  onClick={() => setFilter('general')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    filter === 'general'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  General
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-auto sm:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search packs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Packs Grid */}
          {filteredPacks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery || filter !== 'all' ? 'No packs found' : 'No study packs yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create study packs by selecting multiple files in your Files or Course pages and clicking "Study Together"'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {editingId === pack.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle(pack.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveTitle(pack.id)}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {pack.title}
                          </h3>
                        )}
                        {pack.courseName && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {pack.courseName}
                          </p>
                        )}
                        {!pack.courseId && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            General Files
                          </p>
                        )}
                      </div>
                      {editingId !== pack.id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(pack.id, pack.title)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(pack.id, pack.title)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {pack.pageCount}
                        </p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Pages</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {pack.quizCount}
                        </p>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70">Quiz</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {pack.cardCount}
                        </p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Cards</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {pack.fileCount} files
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(pack.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => setActiveStudyPackId(pack.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
                    >
                      <Sparkles className="w-4 h-4" />
                      Open Study Pack
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Study Pack Viewer */}
      {activeStudyPackId && (
        <StudyPackViewer
          studyPackId={activeStudyPackId}
          onClose={() => setActiveStudyPackId(null)}
        />
      )}
    </>
  );
}
