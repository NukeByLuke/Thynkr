import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface UseStudySessionOptions {
  onFileSelect?: (file: any) => void;
  queryKey?: string[];
  fileSource?: 'study-files' | 'course';
}

export function useStudySession(options: UseStudySessionOptions = {}) {
  const queryClient = useQueryClient();
  const queryKey = options.queryKey || ['study-files'];
  
  const [selectedFile, setSelectedFileState] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'notes' | 'flashcards' | 'quizzes'>('summary');
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState<any | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [quizDifficulty, setQuizDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [numCards, setNumCards] = useState(20);

  const getToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token');

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
      if (options.fileSource === 'course') {
        // For course files, just invalidate the course query
        await queryClient.invalidateQueries({ queryKey });
      } else {
        // For study files, update cache optimistically
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            files: old.files.map((f: any) =>
              f.id === selectedFile?.id ? { ...f, summary: data.summary } : f
            ),
          };
        });
        await queryClient.invalidateQueries({ queryKey });
      }
      
      // Update selected file immediately
      if (selectedFile) {
        setSelectedFileState({ ...selectedFile, summary: data.summary });
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
      if (options.fileSource === 'course') {
        await queryClient.invalidateQueries({ queryKey });
      } else {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            files: old.files.map((f: any) =>
              f.id === selectedFile?.id ? { ...f, notes: data.notes } : f
            ),
          };
        });
        await queryClient.invalidateQueries({ queryKey });
      }
      
      if (selectedFile) {
        setSelectedFileState({ ...selectedFile, notes: data.notes });
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
      if (options.fileSource === 'course') {
        await queryClient.invalidateQueries({ queryKey });
      } else {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            files: old.files.map((f: any) =>
              f.id === selectedFile?.id ? { ...f, quizzes: [...(f.quizzes || []), data.quiz] } : f
            ),
          };
        });
        await queryClient.invalidateQueries({ queryKey });
      }
      
      setSelectedQuiz(data.quiz);
      if (selectedFile) {
        setSelectedFileState({
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
      if (options.fileSource === 'course') {
        await queryClient.invalidateQueries({ queryKey });
      } else {
        queryClient.setQueryData(queryKey, (old: any) => {
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
        await queryClient.invalidateQueries({ queryKey });
      }
      
      setSelectedFlashcardSet(data.flashcardSet);
      if (selectedFile) {
        setSelectedFileState({
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
    mutationFn: async ({
      quizId,
      answers,
    }: {
      quizId: string;
      answers: Record<string, string>;
    }) => {
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

  const handleFileSelect = (file: any) => {
    setSelectedFileState(file);
    setSelectedQuiz(null);
    setSelectedFlashcardSet(null);
    options.onFileSelect?.(file);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedQuiz(null);
    setSelectedFlashcardSet(null);
  };

  return {
    // State
    selectedFile,
    activeTab,
    selectedQuiz,
    selectedFlashcardSet,
    numQuestions,
    quizDifficulty,
    numCards,
    
    // Setters
    setSelectedFile: handleFileSelect,
    setActiveTab: handleTabChange,
    setSelectedQuiz,
    setSelectedFlashcardSet,
    setNumQuestions,
    setQuizDifficulty,
    setNumCards,
    
    // Mutations
    generateSummaryMutation,
    generateNotesMutation,
    generateQuizMutation,
    generateFlashcardsMutation,
    submitQuizMutation,
  };
}
