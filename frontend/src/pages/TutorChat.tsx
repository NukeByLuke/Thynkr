/* eslint-disable react-hooks/rules-of-hooks, no-constant-condition */
// This file has been removed as part of AI Tutor feature removal.

// The TutorChat component and its associated logic have been removed.
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import toast from 'react-hot-toast';
import {
  MessageCircle,
  Send,
  Plus,
  Trash2,
  FileText,
  Menu,
  Edit2,
  Check,
  X,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UpgradePrompt, { useTierAccess } from '@/components/UpgradePrompt';
import { ChatSkeleton, Skeleton } from '@/components/ui/Skeleton';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to build absolute URLs for avatar images
const getAvatarUrl = (avatarUrl?: string) => {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  if (import.meta.env.DEV && avatarUrl.startsWith('/')) return avatarUrl;
  const apiBase = (import.meta.env.VITE_API_URL as string) || '/api';
  const baseUrl = apiBase.replace(/\/api$/, '');
  return `${baseUrl}${avatarUrl}`;
};

interface SourceReference {
  fileId: string;
  fileName: string;
  excerpt: string;
  relevance: number;
}

interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceReference[];
  createdAt: string;
}

interface TutorSession {
  id: string;
  title: string;
  messages: TutorMessage[];
  contextFileId: string | null;
  files?: { file: { id: string; originalName: string } }[];
  createdAt: string;
  updatedAt: string;
}

interface UploadedFile {
  id: string;
  originalName: string;
}

// Component to display source references with collapsible excerpts
function SourcesDisplay({ sources }: { sources: SourceReference[] }) {
  const [expanded, setExpanded] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>
          {sources.length} source{sources.length !== 1 ? 's' : ''} referenced
        </span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {sources.map((source, idx) => (
            <div
              key={`${source.fileId}-${idx}`}
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FileText className="w-3.5 h-3.5 text-primary-500" />
                <span className="truncate">{source.fileName}</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                  {Math.round(source.relevance * 100)}% match
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-3">
                "{source.excerpt}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TutorChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPremiumAccess } = useTierAccess(user?.role);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingSources, setStreamingSources] = useState<SourceReference[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCreateFiles, setSelectedCreateFiles] = useState<string[]>([]);
  const [showManageFiles, setShowManageFiles] = useState(false);
  const [pendingFileIds, setPendingFileIds] = useState<string[]>([]);
  const [displayedMessages, setDisplayedMessages] = useState<TutorMessage[]>([]);
  // Force re-render nudge
  const [renderNudge, setRenderNudge] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper: scroll chat container to bottom only (not the whole page)
  const scrollChatToBottom = (smooth: boolean = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  // Show upgrade prompt if not Premium
  if (!hasPremiumAccess) {
    return (
      <div className="h-full bg-gray-50 dark:bg-[#1E293B] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <UpgradePrompt requiredTier="PREMIUM" feature="AI Tutor Chat" />
        </div>
      </div>
    );
  }

  // Fetch sessions
  const { data: sessions = [] } = useQuery<TutorSession[]>({
    queryKey: ['tutor-sessions'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/tutor/sessions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    retry: false,
  });

  // Fetch current session
  const { data: currentSession } = useQuery<TutorSession>({
    queryKey: ['tutor-session', currentSessionId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/tutor/sessions/${currentSessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    enabled: !!currentSessionId,
    retry: false,
  });

  // Keep a local mirror for immediate UI updates
  // Sync from server whenever session messages change
  useEffect(() => {
    console.log('📊 displayedMessages sync effect triggered:', {
      hasSession: !!currentSession,
      sessionId: currentSession?.id,
      serverMessageCount: currentSession?.messages?.length,
      currentDisplayedCount: displayedMessages.length,
    });

    if (currentSession?.messages) {
      console.log(
        '✅ Syncing displayedMessages from server:',
        currentSession.messages.length,
        'messages'
      );
      setDisplayedMessages(currentSession.messages);
      setRenderNudge((n) => n + 1); // force re-render
      // If user is near the bottom, keep them pinned to latest
      if (isAtBottom) {
        // Defer to next tick to ensure DOM has rendered before scrolling
        requestAnimationFrame(() => scrollChatToBottom(true));
      } else {
        setHasNewMessages(true);
      }
      console.log(
        '📝 displayedMessages state updated, content:',
        currentSession.messages.map((m) => ({ role: m.role, preview: m.content.substring(0, 30) }))
      );
    } else if (!currentSession) {
      console.log('🔄 Clearing displayedMessages (no session)');
      setDisplayedMessages([]);
    }
  }, [currentSession?.id, currentSession?.messages, isAtBottom]);

  // Fetch user's files for context
  const { data: filesData } = useQuery({
    queryKey: ['user-files'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/study/files`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
    retry: false,
  });

  const files: UploadedFile[] = filesData?.files || [];

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async ({ fileIds }: { fileIds: string[] }) => {
      const response = await fetch(`${API_URL}/tutor/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ title: 'New Chat', fileIds }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create session' }));
        throw new Error(error.error || 'Failed to create session');
      }
      return response.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
      setCurrentSessionId(newSession.id);
      setShowCreateModal(false);
      setSelectedCreateFiles([]);
      toast.success('Chat session created!');
    },
    onError: (error: any) => {
      console.error('Failed to create session:', error);
      toast.error(`Failed to create chat session: ${error.message}`);
    },
  });

  // Update session context file
  const updateSessionMutation = useMutation({
    mutationFn: async ({
      sessionId,
      addFileIds,
      removeFileIds,
      title,
    }: {
      sessionId: string;
      addFileIds?: string[];
      removeFileIds?: string[];
      title?: string;
    }) => {
      const body: any = {};
      if (Array.isArray(addFileIds)) body.addFileIds = addFileIds;
      if (Array.isArray(removeFileIds)) body.removeFileIds = removeFileIds;
      if (title !== undefined) body.title = title;

      const response = await fetch(`${API_URL}/tutor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to update session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-session', currentSessionId] });
      queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
    },
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`${API_URL}/tutor/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
      if (currentSessionId && sessions.length > 1) {
        const nextSession = sessions.find((s) => s.id !== currentSessionId);
        setCurrentSessionId(nextSession?.id || null);
      } else {
        setCurrentSessionId(null);
      }
      toast.success('Chat session deleted');
    },
    onError: () => {
      toast.error('Failed to delete session');
    },
  });

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSessionId || isStreaming) return;
    if (!currentSession?.files || currentSession.files.length === 0) {
      toast.error('Attach at least one study file to this chat before sending a message.');
      return;
    }
    // Ensure we have session data in cache before optimistic updates
    const sessionInCache = queryClient.getQueryData<TutorSession>([
      'tutor-session',
      currentSessionId,
    ]);
    if (!sessionInCache && !currentSession) {
      // If the session hasn't loaded yet, fetch it first to avoid UI desync
      await queryClient.invalidateQueries({ queryKey: ['tutor-session', currentSessionId] });
    }

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setStreamingMessage('');
    setStreamingSources([]);
    setIsStreaming(true);
    console.log('🚀 Starting message send');

    // Helper to seed session in cache if not present
    const seedSession = (existing?: TutorSession | undefined): TutorSession => {
      if (existing) return existing;
      if (currentSession) return { ...currentSession };
      // Minimal placeholder to allow optimistic render
      const now = new Date().toISOString();
      return {
        id: currentSessionId,
        title: 'New Chat',
        messages: [],
        contextFileId: null,
        createdAt: now,
        updatedAt: now,
      } as TutorSession;
    };

    // Immediately show user message (cache + local UI)
    queryClient.setQueryData<TutorSession>(['tutor-session', currentSessionId], (old) => {
      const base = seedSession(old);
      return {
        ...base,
        messages: [
          ...base.messages,
          {
            id: 'temp-' + Date.now(),
            role: 'user' as const,
            content: messageContent,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
    // Update sessions list preview optimistically with the user's message
    queryClient.setQueryData<TutorSession[]>(['tutor-sessions'], (old) => {
      if (!old) return old;
      const now = new Date().toISOString();
      return old.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [
                {
                  id: 'preview-user-' + Date.now(),
                  role: 'user',
                  content: messageContent,
                  createdAt: now,
                } as any,
              ],
              updatedAt: now,
            }
          : s
      );
    });
    setDisplayedMessages((prev) => {
      const updated = [
        ...prev,
        {
          id: 'temp-' + Date.now(),
          role: 'user' as const,
          content: messageContent,
          createdAt: new Date().toISOString(),
        },
      ];
      console.log('🔵 Added user message to displayedMessages:', updated.length, 'messages');
      return updated;
    });

    try {
      const response = await fetch(`${API_URL}/tutor/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ message: messageContent }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let receivedSources: SourceReference[] = [];
      let receivedError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            if (data === '[DONE]') {
              break;
            }
            if (data) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  setStreamingMessage(fullResponse);
                }
                // Handle sources from backend
                if (parsed.sources) {
                  receivedSources = parsed.sources;
                  setStreamingSources(parsed.sources);
                }
                // Handle error from backend
                if (parsed.error) {
                  receivedError = parsed.error;
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }

      // Handle error received during streaming
      if (receivedError) {
        toast.error(receivedError);
        setStreamingMessage('');
        setStreamingSources([]);
        setIsStreaming(false);
        // Refetch to restore clean state
        await queryClient.invalidateQueries({ queryKey: ['tutor-session', currentSessionId] });
        return;
      }

      // Add the completed AI message to the session immediately
      if (fullResponse) {
        queryClient.setQueryData<TutorSession>(['tutor-session', currentSessionId], (old) => {
          const base = seedSession(old);
          return {
            ...base,
            messages: [
              ...base.messages,
              {
                id: 'ai-' + Date.now(),
                role: 'assistant' as const,
                content: fullResponse,
                sources: receivedSources.length > 0 ? receivedSources : undefined,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
        // Update sessions list preview with the assistant's response
        queryClient.setQueryData<TutorSession[]>(['tutor-sessions'], (old) => {
          if (!old) return old;
          const now = new Date().toISOString();
          return old.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: [
                    {
                      id: 'preview-ai-' + Date.now(),
                      role: 'assistant',
                      content: fullResponse,
                      createdAt: now,
                    } as any,
                  ],
                  updatedAt: now,
                }
              : s
          );
        });
        setDisplayedMessages((prev) => {
          const updated = [
            ...prev,
            {
              id: 'ai-' + Date.now(),
              role: 'assistant' as const,
              content: fullResponse,
              sources: receivedSources.length > 0 ? receivedSources : undefined,
              createdAt: new Date().toISOString(),
            },
          ];
          console.log('🟢 Added AI message to displayedMessages:', updated.length, 'messages');
          return updated;
        });
      }

      // Clear streaming state
      setStreamingMessage('');
      setStreamingSources([]);
      setIsStreaming(false);

      // Wait 300ms for DB transaction to fully commit before refetching
      console.log('💾 Streaming complete, waiting for DB commit...');
      await new Promise((resolve) => setTimeout(resolve, 300));
      console.log('💾 Refetching from server...');
      await queryClient.invalidateQueries({ queryKey: ['tutor-session', currentSessionId] });
      await queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
      console.log('✅ Refetch complete');
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      const errorMessage = error.message || 'Failed to send message. Please try again.';
      toast.error(errorMessage);
      setStreamingMessage('');
      setStreamingSources([]);
      setIsStreaming(false);
      // Refetch to restore clean state
      await queryClient.invalidateQueries({ queryKey: ['tutor-session', currentSessionId] });
    }
  };

  // Track scroll position to enable polite auto-scroll
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      setIsAtBottom(nearBottom);
      if (nearBottom) setHasNewMessages(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // Initialize state on mount
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll only if user is already near bottom
  // Track the rendered list source (displayedMessages) since that's what we show
  useEffect(() => {
    if (isAtBottom) {
      scrollChatToBottom(true);
    } else {
      // Indicate there are new messages below
      setHasNewMessages(true);
    }
  }, [displayedMessages.length, streamingMessage, isAtBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  // Select first session on load
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTogglePendingFile = (fileId: string) => {
    setPendingFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const applyManageFiles = () => {
    if (!currentSessionId) return;
    const currentIds = new Set((currentSession?.files || []).map((f) => f.file.id));
    const pendingIds = new Set(pendingFileIds);
    const addFileIds = Array.from(pendingIds).filter((id) => !currentIds.has(id));
    const removeFileIds = Array.from(currentIds).filter((id) => !pendingIds.has(id));
    updateSessionMutation.mutate(
      { sessionId: currentSessionId, addFileIds, removeFileIds },
      {
        onSuccess: () => setShowManageFiles(false),
      }
    );
  };

  const handleRenameSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setEditingSessionId(sessionId);
      setEditingTitle(session.title);
    }
  };

  const handleSaveRename = () => {
    if (editingSessionId && editingTitle.trim()) {
      updateSessionMutation.mutate(
        { sessionId: editingSessionId, title: editingTitle.trim() },
        {
          onSuccess: () => {
            setEditingSessionId(null);
            setEditingTitle('');
          },
        }
      );
    }
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // Show loading or nothing while redirecting non-Premium users
  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#1E293B]">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex-col p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
        {/* Chat area skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Skeleton className="h-6 w-48 rounded-md" />
          </div>
          {/* Messages */}
          <div className="flex-1 p-4">
            <ChatSkeleton messageCount={4} />
          </div>
          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'PREMIUM' && user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1E293B]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Premium Feature</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            AI Tutor is only available to Premium members.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#1E293B]">
      {/* Create Chat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Start a new Tutor Chat
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-300 mb-5">
              Select one or more study files to ground the AI tutor.
            </p>
            <div className="flex-1 max-h-72 overflow-y-auto space-y-2">
              {files.length === 0 && (
                <div className="text-sm text-gray-500">
                  You have no uploaded files yet. Upload files in the Study section.
                </div>
              )}
              {files.map((file) => (
                <label
                  key={file.id}
                  className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedCreateFiles.includes(file.id)}
                    onChange={() => {
                      setSelectedCreateFiles((prev) =>
                        prev.includes(file.id)
                          ? prev.filter((id) => id !== file.id)
                          : [...prev, file.id]
                      );
                    }}
                  />
                  <span className="truncate">{file.originalName}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 transition-colors"
                disabled={selectedCreateFiles.length === 0 || createSessionMutation.isPending}
                onClick={() => createSessionMutation.mutate({ fileIds: selectedCreateFiles })}
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar - hidden on mobile by default */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      <div
        className={`${
          showSidebar ? 'w-64 absolute md:relative z-40 h-full shadow-sm' : 'w-0'
        } flex-shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden`}
      >
        <div className="p-4 space-y-4 h-full flex flex-col">
          {/* New Chat Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            disabled={createSessionMutation.isPending}
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-semibold">New Chat</span>
          </button>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  if (editingSessionId !== session.id) {
                    setCurrentSessionId(session.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingSessionId === session.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename();
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                          className="flex-1 text-sm font-medium bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-gray-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveRename}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {session.messages.length > 0
                            ? session.messages[0].content.substring(0, 50)
                            : 'No messages yet'}
                        </p>
                      </>
                    )}
                  </div>
                  {editingSessionId !== session.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameSession(session.id);
                        }}
                        className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-opacity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSessionMutation.mutate(session.id);
                        }}
                        className="text-red-500 hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 bg-blue-500 border-b border-blue-600 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white/90 hidden sm:block" />
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">
              AI Tutor
            </h1>
          </div>

          {/* File Attachments Manager */}
          {currentSessionId && (
            <div className="relative flex items-center gap-2 ml-2">
              <div className="hidden md:flex items-center gap-2 max-w-xs lg:max-w-md overflow-x-auto">
                <FileText className="w-4 h-4 text-white flex-shrink-0" />
                {(currentSession?.files || []).slice(0, 2).map((f) => (
                  <span
                    key={f.file.id}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/20 text-white whitespace-nowrap"
                  >
                    {f.file.originalName.length > 20
                      ? f.file.originalName.substring(0, 17) + '...'
                      : f.file.originalName}
                  </span>
                ))}
                {(currentSession?.files || []).length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{(currentSession?.files || []).length - 2} more
                  </span>
                )}
                {(!currentSession?.files || currentSession.files.length === 0) && (
                  <span className="text-xs text-gray-500">No files</span>
                )}
              </div>
              <button
                onClick={() => {
                  const currentIds = (currentSession?.files || []).map((f) => f.file.id);
                  setPendingFileIds(currentIds);
                  setShowManageFiles((s) => !s);
                }}
                className="text-xs md:text-sm px-2 md:px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 whitespace-nowrap flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5 md:hidden" />
                <span className="hidden md:inline">Manage files</span>
                <span className="md:hidden">Files</span>
                {(currentSession?.files?.length || 0) > 0 && (
                  <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-1.5 rounded-full">
                    {currentSession?.files?.length}
                  </span>
                )}
              </button>

              {showManageFiles && (
                <>
                  <div
                    className="fixed inset-0 bg-black/30 z-40 md:hidden"
                    onClick={() => setShowManageFiles(false)}
                  />
                  <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:right-0 top-1/2 md:top-auto md:mt-2 -translate-y-1/2 md:translate-y-0 w-auto md:w-72 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 md:p-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 md:hidden">
                      Manage Files
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {files.length === 0 && (
                        <div className="text-sm text-gray-500">
                          You have no uploaded files yet. Upload files from the Study section.
                        </div>
                      )}
                      {files.map((file) => (
                        <label
                          key={file.id}
                          className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 py-1"
                        >
                          <input
                            type="checkbox"
                            checked={pendingFileIds.includes(file.id)}
                            onChange={() => handleTogglePendingFile(file.id)}
                            className="w-4 h-4"
                          />
                          <span className="truncate">{file.originalName}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600"
                        onClick={() => setShowManageFiles(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-3 py-1.5 text-sm rounded bg-primary-600 hover:bg-primary-700 text-white disabled:bg-gray-400"
                        onClick={applyManageFiles}
                        disabled={updateSessionMutation.isPending}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="relative flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6 bg-gray-50/50 dark:bg-slate-900/50"
          key={`messages-container-${displayedMessages.length}-${renderNudge}`}
        >
          {displayedMessages.map((message, index) => (
            <div
              key={`${message.id || 'no-id'}-${message.createdAt || index}`}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {message.role === 'assistant' ? (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                ) : user?.avatarUrl ? (
                  <img
                    src={getAvatarUrl(user.avatarUrl)}
                    alt={user.username || 'User'}
                    loading="lazy"
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%]`}
              >
                <div
                  className={`rounded-2xl px-4 md:px-5 py-3.5 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-100 dark:border-slate-700'
                      : 'bg-[#EFF6FF] dark:bg-blue-900/30 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sm md:text-base leading-relaxed [&_p]:leading-[1.7]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{message.content}</ReactMarkdown>
                  </div>
                </div>
                <span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-1.5 px-1">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {/* Source References */}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <SourcesDisplay sources={message.sources} />
                )}
              </div>
            </div>
          ))}

          {/* Streaming message with typing indicator */}
          {isStreaming && (
            <div className="flex gap-3 flex-row">
              {/* AI Avatar */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>

              {/* Message Content */}
              <div className="flex flex-col items-start max-w-[85%] md:max-w-[75%]">
                <div className="rounded-2xl px-4 md:px-5 py-3.5 bg-[#EFF6FF] dark:bg-blue-900/30 text-gray-900 dark:text-white shadow-sm">
                  {streamingMessage ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sm md:text-base leading-relaxed [&_p]:leading-[1.7]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{streamingMessage}</ReactMarkdown>
                    </div>
                  ) : (
                    /* Typing indicator - simple dots */
                    <div className="flex items-center gap-1 py-1 px-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                </div>
                <span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-1.5 px-1">
                  typing...
                </span>
                {/* Show sources while streaming if available */}
                {streamingSources.length > 0 && <SourcesDisplay sources={streamingSources} />}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!currentSession && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to AI Tutor
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md leading-relaxed">
                Start a new chat to get help with your studies. I can answer questions, explain
                concepts, and help you understand your materials.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-sm"
              >
                Start New Chat
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Jump to latest button */}
          {!isAtBottom && hasNewMessages && (
            <div className="absolute bottom-4 right-4">
              <button
                onClick={() => {
                  scrollChatToBottom(true);
                  setHasNewMessages(false);
                }}
                className="px-4 py-2 rounded-full shadow-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
              >
                Jump to latest
              </button>
            </div>
          )}
        </div>

        {/* Input Area - pinned to bottom on mobile */}
        {currentSessionId && (
          <div className="sticky bottom-0 p-4 md:p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 pb-safe">
            <div className="max-w-4xl mx-auto">
              {(!currentSession?.files || currentSession.files.length === 0) && (
                <div className="mb-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Attach at least one study file to chat. Click "Manage files" above to add files.
                  </span>
                </div>
              )}
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 md:px-5 py-3.5 md:py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 max-h-32 overflow-y-auto text-base transition-all"
                  rows={1}
                  disabled={
                    isStreaming || !currentSession?.files || currentSession.files.length === 0
                  }
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    !inputMessage.trim() ||
                    isStreaming ||
                    !currentSession?.files ||
                    currentSession.files.length === 0
                  }
                  className="p-3.5 md:p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-2xl transition-colors disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2.5 text-center hidden md:block">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
