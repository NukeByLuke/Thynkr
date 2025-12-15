/**
 * GameSetupModal Component
 * Wizard for configuring games with polymorphic resource selection (Files or Courses)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader2, FileText, BookOpen } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import ResourceSelector, { ResourceType, Course } from '@/components/ResourceSelector';
import { UploadedFile } from '@/types/global';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

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
  isPro: boolean; // Pass Pro status for access control
  onUpgradeRequired?: () => void; // Callback to show upgrade modal
}

export interface GameConfig {
  selectedFileIds?: string[];
  selectedCourseId?: string;
  difficulty: 'easy' | 'normal' | 'hard';
  questionCount: number;
  pinCode?: string;
  generatedContent?: any[];
}

type Difficulty = 'easy' | 'normal' | 'hard';

// =============================================================================
// Resource Type Toggle Component
// =============================================================================

interface ResourceTypeToggleProps {
  selected: ResourceType;
  onSelect: (type: ResourceType) => void;
  isPro: boolean;
  onProRequired: () => void;
}

function ResourceTypeToggle({ selected, onSelect, isPro, onProRequired }: ResourceTypeToggleProps) {
  const handleCourseClick = () => {
    if (!isPro) {
      onProRequired();
    } else {
      onSelect('COURSE');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onSelect('FILE')}
        className={clsx(
          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
          selected === 'FILE'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        )}
      >
        <FileText className="w-4 h-4" />
        Files
      </button>
      
      <button
        onClick={handleCourseClick}
        className={clsx(
          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
          selected === 'COURSE' && isPro
            ? 'bg-blue-500 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        )}
      >
        <BookOpen className="w-4 h-4" />
        Courses
        {!isPro && (
          <span className="ml-1 px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
            PRO
          </span>
        )}
      </button>
    </div>
  );
}

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
  isPro,
  onUpgradeRequired,
}: GameSetupModalProps) {
  const [resourceType, setResourceType] = useState<ResourceType>('FILE');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user's courses with file count aggregation
  const { data: userCourses = [] } = useQuery<Course[]>({
    queryKey: ['user-courses-summary'],
    queryFn: async () => {
      const response = await api.get('/user-courses');
      return response.data.courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        fileCount: course.files?.length || 0,
        lastStudied: course.lastAccessedAt,
        createdAt: course.createdAt,
      }));
    },
    enabled: isOpen && isPro, // Only fetch if modal is open and user is Pro
  });

  // Handle resource selection toggle
  const handleToggleResource = (id: string) => {
    if (resourceType === 'FILE') {
      setSelectedFileIds((prev) =>
        prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]
      );
    } else {
      // Course selection (single select)
      setSelectedCourseId(id === selectedCourseId ? '' : id);
    }
  };

  // Handle resource type change
  const handleResourceTypeChange = (type: ResourceType) => {
    setResourceType(type);
    // Clear selections when switching types
    setSelectedFileIds([]);
    setSelectedCourseId('');
  };

  // Handle upgrade required callback
  const handleUpgradeRequired = () => {
    if (onUpgradeRequired) {
      onUpgradeRequired();
    }
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
        resourceType,
        fileIds: resourceType === 'FILE' ? selectedFileIds : undefined,
        courseId: resourceType === 'COURSE' ? selectedCourseId : undefined,
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
            ...(resourceType === 'FILE' 
              ? { fileIds: selectedFileIds }
              : { courseId: selectedCourseId }
            ),
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
          ...(resourceType === 'FILE'
            ? { selectedFileIds }
            : { selectedCourseId }
          ),
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
          ...(resourceType === 'FILE' 
            ? { fileIds: selectedFileIds }
            : { courseId: selectedCourseId }
          ),
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
        ...(resourceType === 'FILE'
          ? { selectedFileIds }
          : { selectedCourseId }
        ),
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
      setResourceType('FILE');
      setSelectedFileIds([]);
      setSelectedCourseId('');
      setDifficulty('normal');
      setIsGenerating(false);
      onClose();
    }
  };

  // Determine if generate button should be disabled
  const isGenerateDisabled = 
    (resourceType === 'FILE' && selectedFileIds.length === 0) ||
    (resourceType === 'COURSE' && !selectedCourseId) ||
    isGenerating;

  // Count selected resources
  const selectedCount = resourceType === 'FILE' 
    ? selectedFileIds.length 
    : (selectedCourseId ? 1 : 0);
  
  const selectedLabel = resourceType === 'FILE'
    ? `${selectedCount} file${selectedCount === 1 ? '' : 's'} selected`
    : selectedCount === 1
    ? '1 course selected'
    : 'No course selected';

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
                  {selectedLabel}
                </span>
              </div>

              {/* Resource Type Toggle */}
              <div className="mb-4">
                <ResourceTypeToggle
                  selected={resourceType}
                  onSelect={handleResourceTypeChange}
                  isPro={isPro}
                  onProRequired={handleUpgradeRequired}
                />
              </div>
              
              {/* Polymorphic Resource Selector */}
              <ResourceSelector
                type={resourceType}
                files={userFiles}
                courses={userCourses}
                selectedIds={resourceType === 'FILE' ? selectedFileIds : (selectedCourseId ? [selectedCourseId] : [])}
                onToggle={handleToggleResource}
                multiSelect={resourceType === 'FILE'}
              />
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
              disabled={isGenerateDisabled}
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
