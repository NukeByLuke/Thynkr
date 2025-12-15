import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { StudySidebar } from '../components/study/StudySidebar';
import { StudyContentStage } from '../components/study/StudyContentStage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

interface StudyFile {
  id: string;
  originalName: string;
  fileSize: number;
  status: string;
  summary?: {
    content: string;
  };
  notes?: {
    keyPoints: string[];
    detailed: string;
  };
  quizzes?: Array<{
    id: string;
    title: string;
    questions: any[];
  }>;
  flashcardSets?: Array<{
    id: string;
    title: string;
    cards: any[];
  }>;
}

export default function ImmersiveStudy() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL-based state management
  const fileId = searchParams.get('file');
  const tab = searchParams.get('tab') || 'summary';

  // Local state
  const [selectedFile, setSelectedFile] = useState<StudyFile | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState<any | null>(null);
  const [numCards, setNumCards] = useState(20);
  const [numQuestions, setNumQuestions] = useState(10);
  const [quizDifficulty, setQuizDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getToken = () => localStorage.getItem('token') || '';

  // Fetch files
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
  } = useQuery({
    queryKey: ['study-files'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/study/files`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
  });

  const files: StudyFile[] = filesData?.files || [];

  // Sync selected file with URL parameter
  useEffect(() => {
    if (fileId && files.length > 0) {
      const file = files.find((f) => f.id === fileId);
      if (file) {
        setSelectedFile(file);
      }
    } else if (files.length > 0 && !fileId) {
      // Auto-select first file if none is selected
      const firstFile = files[0];
      setSelectedFile(firstFile);
      setSearchParams({ file: firstFile.id, tab });
    }
  }, [fileId, files, setSearchParams, tab]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (fileList: FileList) => {
      const formData = new FormData();
      Array.from(fileList).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_URL}/study/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      setUploadError(null);
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      await queryClient.refetchQueries({ queryKey: ['study-files'] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Auto-select the first uploaded file
      if (data.files && data.files.length > 0) {
        const newFile = data.files[0];
        setSelectedFile(newFile);
        setSearchParams({ file: newFile.id, tab: 'summary' });
      }
      toast.success('File uploaded successfully!');
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  // Generate summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async ({ fileId, regenerate = false }: { fileId: string; regenerate?: boolean }) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ regenerate }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate summary');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['study-files'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.map((f: any) =>
            f.id === selectedFile?.id ? { ...f, summary: data.summary } : f
          ),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      if (selectedFile) {
        setSelectedFile({ ...selectedFile, summary: data.summary });
      }
      toast.success('Summary generated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate summary: ${error.message}`);
    },
  });

  // Generate notes mutation
  const generateNotesMutation = useMutation({
    mutationFn: async ({ fileId, regenerate = false }: { fileId: string; regenerate?: boolean }) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ regenerate }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate notes');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['study-files'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.map((f: any) =>
            f.id === selectedFile?.id ? { ...f, notes: data.notes } : f
          ),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      if (selectedFile) {
        setSelectedFile({ ...selectedFile, notes: data.notes });
      }
      toast.success('Notes generated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate notes: ${error.message}`);
    },
  });

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async ({
      fileId,
      numQuestions,
      difficulty,
    }: {
      fileId: string;
      numQuestions: number;
      difficulty: string;
    }) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ numQuestions, difficulty }),
      });
      if (!response.ok) throw new Error('Failed to generate quiz');
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['study-files'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.map((f: any) =>
            f.id === selectedFile?.id ? { ...f, quizzes: [...(f.quizzes || []), data.quiz] } : f
          ),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      setSelectedQuiz(data.quiz);
      if (selectedFile) {
        setSelectedFile({
          ...selectedFile,
          quizzes: [...(selectedFile.quizzes || []), data.quiz],
        });
      }
      toast.success('Quiz generated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate quiz: ${error.message}`);
    },
  });

  // Generate flashcards mutation
  const generateFlashcardsMutation = useMutation({
    mutationFn: async ({ fileId, numCards }: { fileId: string; numCards: number }) => {
      const response = await fetch(`${API_URL}/study/files/${fileId}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ numCards }),
      });
      if (!response.ok) throw new Error('Failed to generate flashcards');
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['study-files'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          files: old.files.map((f: any) =>
            f.id === selectedFile?.id
              ? { ...f, flashcardSets: [...(f.flashcardSets || []), data.flashcardSet] }
              : f
          ),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ['study-files'] });
      setSelectedFlashcardSet(data.flashcardSet);
      if (selectedFile) {
        setSelectedFile({
          ...selectedFile,
          flashcardSets: [...(selectedFile.flashcardSets || []), data.flashcardSet],
        });
      }
      toast.success('Flashcards generated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate flashcards: ${error.message}`);
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async ({ quizId, answers }: { quizId: string; answers: Record<string, string> }) => {
      const response = await fetch(`${API_URL}/study/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ answers }),
      });
      if (!response.ok) throw new Error('Failed to submit quiz');
      return response.json();
    },
  });

  // Event handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files);
    }
  };

  const handleFileChange = (file: StudyFile) => {
    setSelectedFile(file);
    setSelectedQuiz(null);
    setSelectedFlashcardSet(null);
    setSearchParams({ file: file.id, tab });
  };

  const handleTabChange = (newTab: string) => {
    setSearchParams({ file: fileId || '', tab: newTab });
    setSelectedQuiz(null);
    setSelectedFlashcardSet(null);
  };

  if (filesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (filesError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading files</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {(filesError as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <StudySidebar
        files={files}
        selectedFile={selectedFile}
        activeTab={tab}
        isCollapsed={isSidebarCollapsed}
        onFileSelect={handleFileChange}
        onTabChange={handleTabChange}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Stage */}
      <StudyContentStage
        selectedFile={selectedFile}
        activeTab={tab}
        selectedQuiz={selectedQuiz}
        selectedFlashcardSet={selectedFlashcardSet}
        numCards={numCards}
        numQuestions={numQuestions}
        quizDifficulty={quizDifficulty}
        onSetNumCards={setNumCards}
        onSetNumQuestions={setNumQuestions}
        onSetQuizDifficulty={setQuizDifficulty}
        onSetSelectedQuiz={setSelectedQuiz}
        generateSummaryMutation={generateSummaryMutation}
        generateNotesMutation={generateNotesMutation}
        generateFlashcardsMutation={generateFlashcardsMutation}
        generateQuizMutation={generateQuizMutation}
        submitQuizMutation={submitQuizMutation}
      />

      {/* Floating Upload Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.doc,.docx,.ppt,.pptx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-full font-medium hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
        >
          <Upload className="h-5 w-5" />
          <span>{uploadMutation.isPending ? 'Uploading...' : 'Upload File'}</span>
        </button>
      </div>

      {/* Upload Error Toast */}
      {uploadError && (
        <div className="fixed bottom-24 right-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg shadow-lg z-50">
          <p className="text-sm">{uploadError}</p>
        </div>
      )}
    </div>
  );
}
