import React, { memo } from 'react';
import { Upload, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

interface StudyFile {
  id: string;
  originalName: string;
  fileSize: number;
  status: string;
  summary?: any;
  notes?: any;
  quizzes?: any[];
  flashcardSets?: any[];
}

interface StudySidebarProps {
  files: StudyFile[];
  selectedFile: StudyFile | null;
  activeTab: string;
  isCollapsed: boolean;
  onFileSelect: (file: StudyFile) => void;
  onTabChange: (tab: string) => void;
  onToggleCollapse: () => void;
}

const StudySidebarComponent: React.FC<StudySidebarProps> = ({
  files,
  selectedFile,
  activeTab,
  isCollapsed,
  onFileSelect,
  onTabChange,
  onToggleCollapse,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
      case 'PROCESSING':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'FAILED':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📄' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'flashcards', label: 'Flashcards', icon: '🎴' },
    { id: 'quizzes', label: 'Quizzes', icon: '❓' },
  ];

  return (
    <aside
      className={`h-screen bg-white/80 dark:bg-slate-900/80 border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col transition-all duration-150 ease-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute top-4 -right-3 z-10 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        )}
      </button>

      {!isCollapsed && (
        <>
          {/* Files Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Source Files</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {files.length === 0 ? (
                <div className="p-3">
                  <EmptyState
                    icon={<Upload className="h-5 w-5" />}
                    title="No files"
                    description="Upload files to begin"
                    illustration="study"
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => onFileSelect(file)}
                      className={`w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        selectedFile?.id === file.id
                          ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-brand-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-gray-900 dark:text-white">
                            {file.originalName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {formatFileSize(file.fileSize)}
                            </p>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusColor(
                                file.status
                              )}`}
                            >
                              {file.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          {selectedFile && (
            <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-3">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 px-1">
                TOOLS
              </h3>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}
        </>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center py-4 space-y-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-700" />
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={tab.label}
            >
              <span className="text-lg">{tab.icon}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};

export const StudySidebar = memo(StudySidebarComponent);
