/**
 * GameSetupModal Component
 * Wizard for configuring games with file selection and settings
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { clsx } from 'clsx';
import FileContextSelector, { FileItem } from '@/components/FileContextSelector';
import { UploadedFile } from '@/types/global';
import Button from '@/components/ui/Button';

// =============================================================================
// Types
// =============================================================================

interface GameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  onStartGame: (config: GameConfig) => void;
  userFiles: UploadedFile[];
  isMultiplayer?: boolean;
}

export interface GameConfig {
  selectedFileIds: string[];
  difficulty: 'easy' | 'normal' | 'hard';
  questionCount: number;
  pinCode?: string;
  generatedContent?: any[];
}

type Difficulty = 'easy' | 'normal' | 'hard';

// =============================================================================
// Difficulty Selector Component
// =============================================================================

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
  const options: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'normal', label: 'Normal' },
    { value: 'hard', label: 'Hard' },
  ];

  return (
    <div className="flex items-center gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={clsx(
            'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
            selected === option.value
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function GameSetupModal({
  isOpen,
  onClose,
  gameTitle,
  onStartGame,
  userFiles,
  isMultiplayer = false,
}: GameSetupModalProps) {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [isGenerating, setIsGenerating] = useState(false);

  // Convert UploadedFile[] to FileItem[]
  const fileItems: FileItem[] = userFiles.map((file) => ({
    id: file.id,
    name: file.originalName,
    type: file.fileType || 'text/plain',
    date: file.createdAt,
  }));

  // Toggle file selection
  const handleToggleFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
    );
  };

  // Handle generate game
  const handleGenerateGame = async () => {
    setIsGenerating(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('accessToken');
      
      // Determine game type based on title
      let gameType = 'QUIZ';
      if (gameTitle.toLowerCase().includes('matching')) {
        gameType = 'MATCHING';
      }
      
      console.log('Generating game content with:', {
        gameType,
        fileIds: selectedFileIds,
        config: {
          difficulty,
          count: 10,
        },
      });
      
      // For solo games, just generate content
      if (!isMultiplayer) {
        const response = await fetch(`${API_URL}/games/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            gameType,
            fileIds: selectedFileIds,
            config: {
              difficulty,
              count: 10,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.message || errorData.error || 'Failed to generate game');
        }

        const data = await response.json();
        console.log('Game content generated:', data);
        
        const config: GameConfig = {
          selectedFileIds,
          difficulty,
          questionCount: 10,
          generatedContent: data.content,
        };
        onStartGame(config);
        return;
      }
      
      // For multiplayer games, create a session with PIN
      const response = await fetch(`${API_URL}/games/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameType: 'QUIZ',
          fileIds: selectedFileIds,
          config: {
            difficulty,
            count: 10,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to create game');
      }

      const data = await response.json();
      console.log('Game session created:', data);
      
      const config: GameConfig = {
        selectedFileIds,
        difficulty,
        questionCount: 10,
        pinCode: data.pinCode,
      };
      onStartGame(config);
    } catch (error) {
      console.error('Failed to generate game:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate game. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    if (!isGenerating) {
      setSelectedFileIds([]);
      setDifficulty('normal');
      setIsGenerating(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          as={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
              Setup {gameTitle}
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {/* Section 1: Choose Source Material */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                  Choose Source Material
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedFileIds.length} file{selectedFileIds.length === 1 ? '' : 's'} selected
                </span>
              </div>
              
              {fileItems.length > 0 ? (
                <FileContextSelector
                  files={fileItems}
                  selectedIds={selectedFileIds}
                  onToggle={handleToggleFile}
                />
              ) : (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No files available. Upload files to get started.
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Difficulty */}
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Difficulty
              </h3>
              <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateGame}
              disabled={selectedFileIds.length === 0 || isGenerating}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Game
                </>
              )}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
