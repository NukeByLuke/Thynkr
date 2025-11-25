// This file has been removed as part of AI Tutor feature removal.

// The TutorChat component and its associated logic have been removed.
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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

export default function TutorChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [streamingMessage, setStreamingMessage] = useState('');
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

  // Redirect if not Premium
  useEffect(() => {
    if (user && user.role !== 'PREMIUM' && user.role !== 'ADMIN') {
      navigate('/pricing');
    }
  }, [user, navigate]);

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
      const response = await fetch(
        `${API_URL}/tutor/sessions/${currentSessionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
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
      console.log('✅ Syncing displayedMessages from server:', currentSession.messages.length, 'messages');
      setDisplayedMessages(currentSession.messages);
      setRenderNudge((n) => n + 1); // force re-render
      // If user is near the bottom, keep them pinned to latest
      if (isAtBottom) {
        // Defer to next tick to ensure DOM has rendered before scrolling
        requestAnimationFrame(() => scrollChatToBottom(true));
      } else {
        setHasNewMessages(true);
      }
      console.log('📝 displayedMessages state updated, content:', currentSession.messages.map(m => ({ role: m.role, preview: m.content.substring(0, 30) })));
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
    },
    onError: (error: any) => {
      console.error('Failed to create session:', error);
      alert(`Failed to create chat session: ${error.message}`);
    },
  });

  // Update session context file
  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, addFileIds, removeFileIds, title }: { sessionId: string; addFileIds?: string[]; removeFileIds?: string[]; title?: string }) => {
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
        const nextSession = sessions.find(s => s.id !== currentSessionId);
        setCurrentSessionId(nextSession?.id || null);
      } else {
        setCurrentSessionId(null);
      }
    },
  });

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSessionId || isStreaming) return;
    if (!currentSession?.files || currentSession.files.length === 0) {
      alert('Attach at least one study file to this chat before sending a message.');
      return;
    }
    // Ensure we have session data in cache before optimistic updates
    const sessionInCache = queryClient.getQueryData<TutorSession>(['tutor-session', currentSessionId]);
    if (!sessionInCache && !currentSession) {
      // If the session hasn't loaded yet, fetch it first to avoid UI desync
      await queryClient.invalidateQueries({ queryKey: ['tutor-session', currentSessionId] });
    }

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setStreamingMessage('');
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
      const response = await fetch(
        `${API_URL}/tutor/sessions/${currentSessionId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ message: messageContent }),
        }
      );

      if (!response.ok) throw new Error('Failed to send message');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

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
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
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
              createdAt: new Date().toISOString(),
            },
          ];
          console.log('🟢 Added AI message to displayedMessages:', updated.length, 'messages');
          return updated;
        });
      }

  // Clear streaming state
  setStreamingMessage('');
  setIsStreaming(false);

      // Wait 300ms for DB transaction to fully commit before refetching
      console.log('💾 Streaming complete, waiting for DB commit...');
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('💾 Refetching from server...');
      await queryClient.invalidateQueries({ queryKey: ['tutor-session', currentSessionId] });
      await queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
      console.log('✅ Refetch complete');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setIsStreaming(false);
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
    updateSessionMutation.mutate({ sessionId: currentSessionId, addFileIds, removeFileIds }, {
      onSuccess: () => setShowManageFiles(false),
    });
  };

  const handleRenameSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user.role !== 'PREMIUM' && user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Premium Feature
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Create Chat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start a new Tutor Chat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select one or more study files to ground the AI tutor.</p>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {files.length === 0 && (
                <div className="text-sm text-gray-500">You have no uploaded files yet. Upload files in the Study section.</div>
              )}
              {files.map((file) => (
                <label key={file.id} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
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
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button
                className="px-3 py-1.5 text-sm rounded bg-primary-600 hover:bg-primary-700 text-white disabled:bg-gray-400"
                disabled={selectedCreateFiles.length === 0 || createSessionMutation.isPending}
                onClick={() => createSessionMutation.mutate({ fileIds: selectedCreateFiles })}
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-64' : 'w-0'
        } flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden`}
      >
        <div className="p-4 space-y-4 h-full flex flex-col">
          {/* New Chat Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            disabled={createSessionMutation.isPending}
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">New Chat</span>
          </button>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
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
                        <button onClick={handleSaveRename} className="text-green-600 hover:text-green-700">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleCancelRename} className="text-red-600 hover:text-red-700">
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
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <MessageCircle className="w-6 h-6 text-primary-600" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Tutor</h1>
          </div>

          {/* File Attachments Manager */}
          {currentSessionId && (
            <div className="relative">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <div className="flex flex-wrap items-center gap-2">
                  {(currentSession?.files || []).map((f) => (
                    <span key={f.file.id} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                      {f.file.originalName}
                    </span>
                  ))}
                  {(!currentSession?.files || currentSession.files.length === 0) && (
                    <span className="text-xs text-gray-500">No files attached</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const currentIds = (currentSession?.files || []).map((f) => f.file.id);
                    setPendingFileIds(currentIds);
                    setShowManageFiles((s) => !s);
                  }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  Manage files
                </button>
              </div>

              {showManageFiles && (
                <div className="absolute right-0 mt-2 w-72 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {files.length === 0 && (
                      <div className="text-sm text-gray-500">You have no uploaded files yet. Upload files from the Study section.</div>
                    )}
                    {files.map((file) => (
                      <label key={file.id} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={pendingFileIds.includes(file.id)}
                          onChange={() => handleTogglePendingFile(file.id)}
                        />
                        <span className="truncate">{file.originalName}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600" onClick={() => setShowManageFiles(false)}>Cancel</button>
                    <button className="px-3 py-1.5 text-sm rounded bg-primary-600 hover:bg-primary-700 text-white disabled:bg-gray-400" onClick={applyManageFiles} disabled={updateSessionMutation.isPending}>
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="relative flex-1 overflow-y-auto p-4 space-y-6"
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-primary-500 to-blue-500 flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                ) : user?.avatarUrl ? (
                  <img
                    src={getAvatarUrl(user.avatarUrl)}
                    alt={user.username || 'User'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Streaming message with typing indicator */}
          {isStreaming && (
            <div className="flex gap-3 flex-row">
              {/* AI Avatar */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-primary-500 to-blue-500 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Message Content */}
              <div className="flex flex-col items-start max-w-[75%]">
                <div className="rounded-2xl px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                  {streamingMessage ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingMessage}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 py-1">
                      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                  typing...
                </span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!currentSession && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Welcome to AI Tutor
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                Start a new chat to get help with your studies. I can answer questions, explain
                concepts, and help you understand your materials.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
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
                className="px-3 py-2 rounded-full shadow-md bg-primary-600 hover:bg-primary-700 text-white text-sm"
              >
                Jump to latest
              </button>
            </div>
          )}
        </div>

        {/* Input Area */}
        {currentSessionId && (
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto">
              {(!currentSession?.files || currentSession.files.length === 0) && (
                <div className="mb-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded p-2">
                  Attach at least one study file to chat. Click "Manage files" above to add files.
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32 overflow-y-auto"
                  rows={1}
                  disabled={isStreaming || !currentSession?.files || currentSession.files.length === 0}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isStreaming || !currentSession?.files || currentSession.files.length === 0}
                  className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
